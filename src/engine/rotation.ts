import { allSkills } from "./catalog";
import { barSkillIds, skillBaseHit, type BuildInput, type DerivedStats } from "./compute";
import type { SkillDef } from "./types";

const GCD = 1;
const PARSE = 24;
const SWAP = 0.15;
const LA_COEFF = 0.1;
const DUMMY_RESIST = 18200;
const RESIST_K = 33000;
const STEP = 0.1;

type Overlay = {
  id: string;
  duration: number;
  maxStacks: number;
  dmgDone?: number;
  dmgTaken?: number;
  generateCrux?: number;
  spendCrux?: boolean;
  cruxDmg?: number;
};

const OVERLAYS: Record<string, Overlay> = {
  "writhing-runeblades": { id: "crux", duration: 0, maxStacks: 3, generateCrux: 1 },
  fatecarver: { id: "crux", duration: 0, maxStacks: 3, spendCrux: true, cruxDmg: 0.11 },
  "combat-prayer": { id: "minor-berserk", duration: 8, maxStacks: 1, dmgDone: 0.05 },
  "standard-of-might": { id: "banner", duration: 16, maxStacks: 1, dmgDone: 0.08, dmgTaken: 0.08 },
  "power-surge": { id: "minor-berserk", duration: 33, maxStacks: 1, dmgDone: 0.05 },
  "surprise-attack": { id: "minor-vuln", duration: 8, maxStacks: 1, dmgTaken: 0.05 },
  "fetcher-infection": { id: "minor-vuln", duration: 20, maxStacks: 1, dmgTaken: 0.05 },
  "grim-focus": { id: "grim", duration: 20, maxStacks: 5, dmgDone: 0.02 },
};

const CHANNELS = new Set(["fatecarver", "tide-kings-gaze", "rapid-strikes"]);

export type RotationSource = { id: string; name: string; damage: number; pct: number };
export type RotationAura = { name: string; uptime: number };
export type RotationCast = { t: number; name: string; damage: number };

export type RotationResult = {
  dps: number;
  totalDamage: number;
  duration: number;
  mitigation: number;
  sources: RotationSource[];
  auras: RotationAura[];
  casts: RotationCast[];
};

type Aura = Overlay & { until: number; stacks: number; name: string };
type Dot = {
  id: string;
  name: string;
  until: number;
  tickEvery: number;
  nextTick: number;
  tickDmg: number;
};

function rankOf(input: BuildInput, skill: SkillDef) {
  return Math.min(skill.maxRank, Math.max(1, input.skillRanks[skill.id] ?? skill.maxRank));
}

function isChannel(skill: SkillDef) {
  return CHANNELS.has(skill.id) || (Boolean(skill.ticks) && (skill.duration ?? 0) >= 3 && !skill.isDot);
}

function isDot(skill: SkillDef) {
  return Boolean(skill.isDot);
}

function isDamage(skill: SkillDef) {
  return !skill.isHeal && (skill.maxStatCoeff > 0 || skill.maxDamageCoeff > 0);
}

function mitFactor(pen: number) {
  const r = Math.max(0, DUMMY_RESIST - pen);
  return 1 - r / (r + RESIST_K);
}

function mul(stats: DerivedStats, auras: Aura[], now: number, extra = 0) {
  let add = stats.damageDonePct + extra;
  let taken = 0;
  for (const a of auras) {
    if (a.duration > 0 && a.until < now) continue;
    add += (a.dmgDone ?? 0) * Math.max(1, a.stacks);
    taken += (a.dmgTaken ?? 0) * Math.max(1, a.stacks);
  }
  return (1 + add) * (1 + taken);
}

type ChannelJob = {
  skill: SkillDef;
  ticksLeft: number;
  perTick: number;
  every: number;
  next: number;
};

export function computeRotation(input: BuildInput, stats: DerivedStats): RotationResult {
  const ids = [...new Set([...barSkillIds(input.frontBar), ...barSkillIds(input.backBar)])];
  const byId = new Map<string, SkillDef>();
  for (const id of ids) {
    const s = allSkills().find((x) => x.id === id);
    if (s && s.kind !== "passive") byId.set(id, s);
  }

  const onFront = (id: string) => input.frontBar.slots.includes(id) || input.frontBar.ultimate === id;
  const onBack = (id: string) => input.backBar.slots.includes(id) || input.backBar.ultimate === id;

  const dmgSkills = [...byId.values()].filter(isDamage);
  const dots = dmgSkills.filter(isDot);
  const channels = dmgSkills.filter(isChannel);
  const spams = dmgSkills.filter((s) => !isDot(s) && !isChannel(s) && s.kind === "active");
  const ults = dmgSkills.filter((s) => s.kind === "ultimate");
  const maintains = [...byId.values()].filter((s) => OVERLAYS[s.id] && OVERLAYS[s.id].duration > 0 && !isDot(s));

  const mit = mitFactor(stats.penetration);
  const sources = new Map<string, { name: string; damage: number }>();
  const addDmg = (id: string, name: string, amount: number) => {
    const n = Math.max(0, amount * mit);
    const cur = sources.get(id) ?? { name, damage: 0 };
    cur.damage += n;
    sources.set(id, cur);
    return n;
  };

  const auras: Aura[] = [];
  const activeDots: Dot[] = [];
  let crux = 0;
  let bar: "front" | "back" = "front";
  let t = 0;
  let busyUntil = 0;
  let ultReady = 0;
  const auraUptime = new Map<string, number>();
  const casts: RotationCast[] = [];
  const channelRef: { job: ChannelJob | null } = { job: null };

  const applyOverlay = (skill: SkillDef, now: number) => {
    const ov = OVERLAYS[skill.id];
    if (!ov) return 0;
    if (ov.generateCrux) crux = Math.min(3, crux + ov.generateCrux);
    let extra = 0;
    if (ov.spendCrux) {
      extra = (ov.cruxDmg ?? 0) * crux;
      crux = 0;
    }
    if (ov.duration > 0) {
      const existing = auras.find((a) => a.id === ov.id);
      if (existing) {
        existing.until = now + ov.duration;
        existing.stacks = Math.min(ov.maxStacks, existing.stacks + 1);
      } else {
        auras.push({ ...ov, until: now + ov.duration, stacks: 1, name: skill.name });
      }
    }
    return extra;
  };

  const placeDot = (skill: SkillDef, now: number, extra: number) => {
    const dur = skill.duration ?? 10;
    const ticks = Math.max(1, skill.ticks ?? Math.round(dur));
    const total = skillBaseHit(skill, stats, rankOf(input, skill)) * mul(stats, auras, now, extra);
    const tickEvery = dur / ticks;
    const i = activeDots.findIndex((d) => d.id === skill.id);
    const dot: Dot = {
      id: skill.id,
      name: skill.name,
      until: now + dur,
      tickEvery,
      nextTick: now + tickEvery,
      tickDmg: total / ticks,
    };
    if (i >= 0) activeDots[i] = dot;
    else activeDots.push(dot);
  };

  const lightAttack = () => {
    const hit =
      stats.maxDamage * LA_COEFF * (1 + stats.critChance * stats.critDamage) * mul(stats, auras, t);
    addDmg("light-attack", "Лёгкая атака", hit);
  };

  const startCast = (skill: SkillDef) => {
    const extra = applyOverlay(skill, t);
    if (isDot(skill)) {
      placeDot(skill, t, extra);
      casts.push({ t, name: skill.name, damage: 0 });
      busyUntil = t + GCD;
      return;
    }
    if (isChannel(skill)) {
      const ticks = Math.max(1, skill.ticks ?? 1);
      const dur = skill.duration ?? 4;
      const total = skillBaseHit(skill, stats, rankOf(input, skill)) * mul(stats, auras, t, extra);
      channelRef.job = { skill, ticksLeft: ticks, perTick: total / ticks, every: dur / ticks, next: t + dur / ticks };
      casts.push({ t, name: skill.name, damage: total * mit });
      busyUntil = t + dur;
      return;
    }
    const hit = skill.isHeal ? 0 : skillBaseHit(skill, stats, rankOf(input, skill)) * mul(stats, auras, t, extra);
    const dealt = hit ? addDmg(skill.id, skill.name, hit) : 0;
    casts.push({ t, name: skill.name, damage: dealt });
    busyUntil = t + GCD;
  };

  const needSwap = (id: string): "front" | "back" | null => {
    const f = onFront(id);
    const b = onBack(id);
    if (bar === "front" && f) return null;
    if (bar === "back" && b) return null;
    if (f) return "front";
    if (b) return "back";
    return null;
  };

  const pick = (): SkillDef | null => {
    const remaining = (skill: SkillDef) => {
      const d = activeDots.find((x) => x.id === skill.id);
      return d && d.until > t ? d.until - t : 0;
    };
    const auraLeft = (id: string) => {
      const a = auras.find((x) => x.id === id && x.until > t);
      return a ? a.until - t : 0;
    };

    for (const u of ults) {
      if (t >= ultReady) return u;
    }
    for (const d of dots) {
      if (remaining(d) < 0.45) return d;
    }
    for (const m of maintains) {
      const ov = OVERLAYS[m.id];
      if (ov && auraLeft(ov.id) < 0.45) return m;
    }
    const carver = channels.find((s) => s.id === "fatecarver");
    const blades = spams.find((s) => s.id === "writhing-runeblades");
    if (carver && crux >= 3) return carver;
    if (blades && crux < 3) return blades;
    if (carver) return carver;
    const ch = channels[0];
    const onBarSpam = spams.filter((s) => (bar === "front" ? onFront(s.id) : onBack(s.id)));
    const pool = onBarSpam.length ? onBarSpam : spams;
    if (!pool.length) return ch ?? null;
    return [...pool].sort(
      (a, b) => skillBaseHit(b, stats, rankOf(input, b)) - skillBaseHit(a, stats, rankOf(input, a)),
    )[0];
  };

  while (t < PARSE) {
    for (const a of auras) {
      if (a.duration > 0 && a.until >= t) auraUptime.set(a.id, (auraUptime.get(a.id) ?? 0) + STEP);
    }
    for (const d of [...activeDots]) {
      if (d.nextTick <= t + 0.001 && t <= d.until + 0.05) {
        addDmg(d.id, d.name, d.tickDmg);
        d.nextTick += d.tickEvery;
      }
    }
    const ch = channelRef.job;
    if (ch && ch.next <= t + 0.001 && ch.ticksLeft > 0) {
      addDmg(ch.skill.id, ch.skill.name, ch.perTick);
      ch.ticksLeft -= 1;
      ch.next += ch.every;
      if (ch.ticksLeft <= 0) channelRef.job = null;
    }

    if (t >= busyUntil - 0.001) {
      const skill = pick();
      if (skill) {
        const swapTo = needSwap(skill.id);
        if (swapTo) {
          bar = swapTo;
          busyUntil = t + SWAP;
        } else {
          lightAttack();
          startCast(skill);
          if (skill.kind === "ultimate") ultReady = t + Math.max(skill.duration ?? 8, 18);
        }
      } else {
        busyUntil = t + STEP;
      }
    }
    t += STEP;
  }

  const totalDamage = [...sources.values()].reduce((s, x) => s + x.damage, 0);
  const list: RotationSource[] = [...sources.entries()]
    .filter(([, v]) => v.damage > 1)
    .map(([id, v]) => ({
      id,
      name: v.name,
      damage: v.damage,
      pct: totalDamage ? (100 * v.damage) / totalDamage : 0,
    }))
    .sort((a, b) => b.damage - a.damage);

  const auraNames: Record<string, string> = {
    "minor-berserk": "Minor Berserk",
    banner: "Знамя",
    "minor-vuln": "Minor Vulnerability",
    grim: "Grim Focus",
  };

  return {
    dps: totalDamage / PARSE,
    totalDamage,
    duration: PARSE,
    mitigation: mit,
    sources: list,
    auras: [...auraUptime.entries()].map(([id, up]) => ({
      name: auraNames[id] ?? id,
      uptime: Math.min(1, up / PARSE),
    })),
    casts: casts.filter((c) => c.t < PARSE),
  };
}
