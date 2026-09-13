import {
  ATTRIBUTE_POINTS,
  BASE_CRIT_DAMAGE,
  BASE_HEALTH,
  BASE_HEALTH_RECOVERY,
  BASE_MAG_RECOVERY,
  BASE_MAGICKA,
  BASE_STAM_RECOVERY,
  BASE_STAMINA,
  HEALTH_PER_POINT,
  MAG_STAM_PER_POINT,
  allSkills,
  classes,
  foods,
  mundus,
  races,
  skillLinesForClass,
} from "./catalog";
import {
  evaluateLoadout,
  presetKindForGoal,
  presetLoadout,
  type GearMix,
  type Loadout,
} from "./gear";
import { goals } from "./goals";
import { META_ICONS, skillIconFile } from "./icons";
import { addMods, emptyMods, scaleMods } from "./mods";
import type { GoalId, SkillDef } from "./types";

export type Attributes = { magicka: number; stamina: number; health: number };

export type SkillBar = {
  slots: [string | null, string | null, string | null, string | null, string | null];
  ultimate: string | null;
};

export type BuildInput = {
  classId: string;
  raceId: string;
  goalId: GoalId;
  mundusId: string;
  foodId: string;
  attributes: Attributes;
  loadout: Loadout;
  gearMix: GearMix;
  frontBar: SkillBar;
  backBar: SkillBar;
  passiveIds: string[];
  skillRanks: Record<string, number>;
  majorBrutality: boolean;
  majorSorcery: boolean;
  majorFortitude: boolean;
  majorIntellect: boolean;
  majorEndurance: boolean;
};

export type DerivedStats = {
  magicka: number;
  stamina: number;
  health: number;
  spellDamage: number;
  weaponDamage: number;
  magickaRecovery: number;
  staminaRecovery: number;
  healthRecovery: number;
  critChance: number;
  critDamage: number;
  penetration: number;
  physicalResist: number;
  spellResist: number;
  healingDonePct: number;
  damageDonePct: number;
  maxStat: number;
  maxDamage: number;
};

export type SkillForecast = {
  skill: SkillDef;
  rank: number;
  hit: number;
  perSecond: number;
  isHeal: boolean;
  onBar: "front" | "back" | "both" | "passive";
};

export function barSkillIds(bar: SkillBar): string[] {
  return [...bar.slots, bar.ultimate].filter((id): id is string => Boolean(id));
}

export function equippedSkillIds(input: BuildInput): string[] {
  return [...new Set([...barSkillIds(input.frontBar), ...barSkillIds(input.backBar), ...input.passiveIds])];
}

export function emptyBar(): SkillBar {
  return { slots: [null, null, null, null, null], ultimate: null };
}

function asSlots(slots: (string | null)[]): SkillBar["slots"] {
  return [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null, slots[3] ?? null, slots[4] ?? null];
}

/** Put a skill on a bar slot; if it already sits elsewhere, swap so the hotkey stays unique. */
export function setBarSlot(bar: SkillBar, index: number, id: string | null): SkillBar {
  const slots = [...bar.slots];
  if (!id) {
    slots[index] = null;
    return { ...bar, slots: asSlots(slots) };
  }
  const existing = slots.indexOf(id);
  if (existing === index) return bar;
  if (existing >= 0) {
    slots[existing] = slots[index];
    slots[index] = id;
  } else {
    slots[index] = id;
  }
  return { ...bar, slots: asSlots(slots) };
}

/** If the skill is also on the other bar, move it to the same slot (swap). */
export function mirrorSlot(other: SkillBar, index: number, id: string | null): SkillBar {
  if (!id || !other.slots.includes(id)) return other;
  return setBarSlot(other, index, id);
}

/** After both bars are filled, shared skills take the front bar's slot numbers. */
export function syncSharedSlots(front: SkillBar, back: SkillBar): SkillBar {
  let next = back;
  front.slots.forEach((id, i) => {
    if (id && next.slots.includes(id)) next = setBarSlot(next, i, id);
  });
  if (front.ultimate && next.ultimate === front.ultimate) {
    next = { ...next, ultimate: front.ultimate };
  }
  return next;
}

export function compute(input: BuildInput): {
  stats: DerivedStats;
  skills: SkillForecast[];
  score: number;
  gearWarnings: string[];
  setCounts: ReturnType<typeof evaluateLoadout>["setCounts"];
  weights: ReturnType<typeof evaluateLoadout>["weights"];
} {
  const race = races.find((r) => r.id === input.raceId) ?? races[0];
  const stone = mundus.find((m) => m.id === input.mundusId) ?? mundus[0];
  const food = foods.find((f) => f.id === input.foodId) ?? foods[0];
  const goal = goals.find((g) => g.id === input.goalId) ?? goals[0];
  const gear = evaluateLoadout(input.loadout);

  const mods = emptyMods();
  addMods(mods, race.mods);
  addMods(mods, scaleMods(stone.mods, gear.mundusFactor));
  addMods(mods, food.mods);
  addMods(mods, gear.mods);

  const selected = equippedSkillIds(input)
    .map((id) => allSkills().find((s) => s.id === id))
    .filter((s): s is SkillDef => Boolean(s));

  for (const skill of selected) {
    const rank = Math.min(skill.maxRank, Math.max(1, input.skillRanks[skill.id] ?? skill.maxRank));
    addMods(mods, skill.mods, rank, skill.rankMods);
  }

  if (input.majorSorcery) mods.spellDamagePct += 0.2;
  if (input.majorBrutality) mods.weaponDamagePct += 0.2;
  if (input.majorFortitude) mods.healthRecoveryPct += 0.3;
  if (input.majorIntellect) mods.magickaRecoveryPct += 0.3;
  if (input.majorEndurance) mods.staminaRecoveryPct += 0.3;

  const magickaFlat =
    BASE_MAGICKA + input.attributes.magicka * MAG_STAM_PER_POINT + mods.magicka;
  const staminaFlat =
    BASE_STAMINA + input.attributes.stamina * MAG_STAM_PER_POINT + mods.stamina;
  const healthFlat = BASE_HEALTH + input.attributes.health * HEALTH_PER_POINT + mods.health;

  const magicka = Math.round(magickaFlat * (1 + mods.magickaPct));
  const stamina = Math.round(staminaFlat * (1 + mods.staminaPct));
  const health = Math.round(healthFlat * (1 + mods.healthPct));

  const spellDamage = Math.round(Math.max(0, mods.spellDamage) * (1 + mods.spellDamagePct));
  const weaponDamage = Math.round(Math.max(0, mods.weaponDamage) * (1 + mods.weaponDamagePct));

  const magickaRecovery = Math.round(
    (BASE_MAG_RECOVERY + mods.magickaRecovery) * (1 + mods.magickaRecoveryPct),
  );
  const staminaRecovery = Math.round(
    (BASE_STAM_RECOVERY + mods.staminaRecovery) * (1 + mods.staminaRecoveryPct),
  );
  const healthRecovery = Math.round(
    (BASE_HEALTH_RECOVERY + mods.healthRecovery) * (1 + mods.healthRecoveryPct),
  );

  const maxStat = Math.max(magicka, stamina);
  const maxDamage = Math.max(spellDamage, weaponDamage);

  const stats: DerivedStats = {
    magicka,
    stamina,
    health,
    spellDamage,
    weaponDamage,
    magickaRecovery,
    staminaRecovery,
    healthRecovery,
    critChance: Math.min(1, 0.1 + mods.critChance),
    critDamage: BASE_CRIT_DAMAGE + mods.critDamage,
    penetration: mods.penetration,
    physicalResist: mods.physicalResist,
    spellResist: mods.spellResist,
    healingDonePct: mods.healingDonePct,
    damageDonePct: mods.damageDonePct,
    maxStat,
    maxDamage,
  };

  const front = new Set(barSkillIds(input.frontBar));
  const back = new Set(barSkillIds(input.backBar));

  const skills: SkillForecast[] = selected
    .filter((s) => s.maxStatCoeff > 0 || s.maxDamageCoeff > 0)
    .map((skill) => {
      const rank = Math.min(skill.maxRank, Math.max(1, input.skillRanks[skill.id] ?? skill.maxRank));
      const rankScale = 0.85 + 0.05 * rank;
      const raw =
        (skill.maxStatCoeff * stats.maxStat + skill.maxDamageCoeff * stats.maxDamage) * rankScale;
      const critAvg = 1 + stats.critChance * stats.critDamage;
      const done = skill.isHeal ? 1 + stats.healingDonePct : 1 + stats.damageDonePct;
      const hit = Math.round(raw * critAvg * done);
      const ticks = skill.ticks ?? 1;
      const duration = skill.duration ?? 1;
      const perSecond = Math.round((hit * (skill.isDot ? ticks : 1)) / Math.max(duration, 1));
      const f = front.has(skill.id);
      const b = back.has(skill.id);
      const onBar: SkillForecast["onBar"] = f && b ? "both" : f ? "front" : b ? "back" : "passive";
      return { skill, rank, hit, perSecond, isHeal: Boolean(skill.isHeal), onBar };
    });

  const bestDmg = Math.max(0, ...skills.filter((s) => !s.isHeal).map((s) => s.hit));
  const bestHeal = Math.max(0, ...skills.filter((s) => s.isHeal).map((s) => s.hit));
  const w = goal.weights;
  const score =
    w.damage * bestDmg +
    w.heal * bestHeal +
    w.hpRegen * healthRecovery * 8 +
    w.resourceRegen * (magickaRecovery + staminaRecovery) * 4 +
    w.health * health * 0.15 +
    w.resist * (stats.physicalResist + stats.spellResist) * 0.05;

  return { stats, skills, score, gearWarnings: gear.warnings, setCounts: gear.setCounts, weights: gear.weights };
}

export function remainingAttributes(a: Attributes) {
  return ATTRIBUTE_POINTS - a.magicka - a.stamina - a.health;
}

export function optimizeAttributes(base: Omit<BuildInput, "attributes">): Attributes {
  let best: Attributes = { magicka: 0, stamina: 0, health: 0 };
  let bestScore = -Infinity;
  const step = 4;
  for (let m = 0; m <= ATTRIBUTE_POINTS; m += step) {
    for (let s = 0; s <= ATTRIBUTE_POINTS - m; s += step) {
      const h = ATTRIBUTE_POINTS - m - s;
      const { score } = compute({ ...base, attributes: { magicka: m, stamina: s, health: h } });
      if (score > bestScore) {
        bestScore = score;
        best = { magicka: m, stamina: s, health: h };
      }
    }
  }
  return best;
}

function fillBar(ids: (string | null | undefined)[], ult?: string | null): SkillBar {
  const seen = new Set<string>();
  const slots: SkillBar["slots"] = [null, null, null, null, null];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    const i = slots.indexOf(null);
    if (i < 0) break;
    slots[i] = id;
    seen.add(id);
  }
  return { slots, ultimate: ult ?? null };
}

export function suggestForGoal(goalId: GoalId, classId: string, gearMix: GearMix = "mixed"): BuildInput {
  const goal = goals.find((g) => g.id === goalId) ?? goals[0];
  const cls = classes.find((c) => c.id === classId) ?? classes[0];
  const classSkills = skillLinesForClass(cls.id).flatMap((l) => l.skills);
  const pick = (list: SkillDef[], pred: (s: SkillDef) => boolean, n: number) =>
    list.filter(pred).slice(0, n).map((s) => s.id);

  const dmg = pick(classSkills, (s) => s.kind === "active" && !s.isHeal, 8);
  const heals = pick(classSkills, (s) => Boolean(s.isHeal) && s.kind !== "ultimate", 4);
  const shields = pick(
    classSkills,
    (s) => s.kind === "active" && Boolean(s.mods?.physicalResist || s.mods?.healthPct),
    2,
  );
  const ult =
    classSkills.find((s) => s.kind === "ultimate" && !s.isHeal)?.id ??
    classSkills.find((s) => s.kind === "ultimate")?.id ??
    null;
  const passives = pick(classSkills, (s) => s.kind === "passive", 4);

  const wall = "wall-of-elements";
  const hail = "endless-hail";
  const springs = "healing-springs";
  const prayer = "combat-prayer";
  const taunt = "puncturing-remedy";
  const shock = "crushing-shock";
  const poison = "poison-injection";
  const dw = "rapid-strikes";
  const twoh = "stampede";

  const magWeapons = [shock, wall, springs, prayer];
  const stamWeapons = [dw, hail, poison, twoh];

  const kind = presetKindForGoal(goalId);
  const loadout = presetLoadout(kind, gearMix);
  let front = fillBar([...dmg, ...shields, ...heals, ...magWeapons], ult);
  let back = fillBar([wall, ...dmg.slice(1), springs, ...heals, shock, ...shields], ult);

  if (goalId === "max-heal") {
    front = fillBar([...heals, prayer, springs, ...dmg, ...shields], ult);
    back = fillBar([wall, springs, prayer, ...heals, ...dmg], ult);
  } else if (goalId === "tank") {
    front = fillBar([taunt, ...shields, ...heals, springs, ...dmg], ult);
    back = fillBar([wall, taunt, springs, ...heals, ...shields, ...dmg], ult);
  } else if (goalId === "max-hp-regen" || goalId === "max-resource-regen") {
    front = fillBar([...heals, springs, ...shields, ...dmg, prayer], ult);
    back = fillBar([springs, wall, prayer, ...heals, ...dmg], ult);
  } else if (goalId === "balanced-dps-sustain") {
    front = fillBar([...dmg, springs, ...heals, ...shields, shock], ult);
    back = fillBar([wall, springs, ...heals, ...dmg, shock], ult);
  } else if (kind === "stam-dps") {
    front = fillBar([...dmg, ...stamWeapons, ...heals], ult);
    back = fillBar([hail, poison, ...dmg, ...stamWeapons, ...heals], ult);
  }

  back = syncSharedSlots(front, back);

  const raceId =
    goalId === "tank" ? "nord" : goalId === "max-heal" ? "argonian" : "high-elf";

  const ranks: Record<string, number> = {};
  for (const id of [...barSkillIds(front), ...barSkillIds(back), ...passives]) {
    const sk = allSkills().find((s) => s.id === id);
    if (sk) ranks[id] = sk.maxRank;
  }

  const withoutAttr: Omit<BuildInput, "attributes"> = {
    classId: cls.id,
    raceId,
    goalId,
    mundusId: goal.preferredMundus[0],
    foodId: goal.preferredFood[0],
    loadout,
    gearMix,
    frontBar: front,
    backBar: back,
    passiveIds: passives,
    skillRanks: ranks,
    majorBrutality: goal.preferredGear === "stam-dps" || goal.preferredGear === "mag-dps",
    majorSorcery: goal.preferredGear !== "stam-dps",
    majorFortitude: goalId === "max-hp-regen" || goalId === "tank",
    majorIntellect: goalId !== "tank" && goal.preferredGear !== "stam-dps",
    majorEndurance: goal.preferredGear === "stam-dps" || goalId === "max-resource-regen",
  };

  return { ...withoutAttr, attributes: optimizeAttributes(withoutAttr) };
}

export type LevelingNode = {
  id: string;
  phase: "start" | "craft" | "drop" | "skills" | "champion";
  title: string;
  detail: string;
  icon: string;
  skillId?: string;
};

export function levelingPlan(input: BuildInput): LevelingNode[] {
  const ids = equippedSkillIds(input);
  const skills = ids
    .map((id) => allSkills().find((s) => s.id === id))
    .filter((s): s is SkillDef => Boolean(s));

  const passives = skills.filter((s) => s.kind === "passive");
  const actives = skills.filter((s) => s.kind !== "passive");
  const damage = actives.filter((s) => !s.isHeal).sort((a, b) => b.maxDamageCoeff - a.maxDamageCoeff);
  const heals = actives.filter((s) => s.isHeal);

  const nodes: LevelingNode[] = [];
  const attr = input.attributes;
  const main =
    attr.magicka >= attr.stamina && attr.magicka >= attr.health
      ? "магию"
      : attr.stamina >= attr.health
        ? "запас сил"
        : "здоровье";
  const mainIcon =
    main === "магию" ? META_ICONS.magicka : main === "запас сил" ? META_ICONS.stamina : META_ICONS.health;

  nodes.push({
    id: "attr",
    phase: "start",
    title: `Атрибуты: ${attr.magicka} / ${attr.stamina} / ${attr.health}`,
    detail: `Цель «${goals.find((g) => g.id === input.goalId)?.name}». До 50 уровня почти все 64 очка кладите в ${main}.`,
    icon: mainIcon,
  });

  const gear = evaluateLoadout(input.loadout);
  const craftSets = gear.setCounts.filter((s) => s.set.source === "craft" && s.set.id !== "none");
  const dropSets = gear.setCounts.filter((s) => s.set.source !== "craft" && s.set.id !== "none");

  for (const s of craftSets) {
    nodes.push({
      id: `craft-${s.set.id}`,
      phase: "craft",
      title: `${s.set.name} ${s.count}/${s.set.maxPieces}`,
      detail: `Крафт. ${s.set.where}. Чертежи, глифы зачарования, камни черт.`,
      icon: META_ICONS.craft,
    });
  }
  for (const s of dropSets) {
    nodes.push({
      id: `drop-${s.set.id}`,
      phase: "drop",
      title: `${s.set.name} ${s.count}/${s.set.maxPieces}`,
      detail: `Дроп: ${s.set.where}.`,
      icon: META_ICONS.drop,
    });
  }

  let i = 1;
  for (const s of [...damage.slice(0, 2), ...heals.slice(0, 1), ...passives, ...damage.slice(2), ...heals.slice(1)]) {
    nodes.push({
      id: `skill-${s.id}`,
      phase: "skills",
      title: `${i}. ${s.name} → ранг ${s.maxRank}`,
      detail: s.levelingNote,
      icon: skillIconFile(s.id),
      skillId: s.id,
    });
    i += 1;
  }

  nodes.push({
    id: "cp",
    phase: "champion",
    title: "Чемпионские очки",
    detail:
      input.goalId === "tank"
        ? "Fitness: Boundless Vitality, Fortified, Rejuvenation. Warfare — защита."
        : input.goalId === "max-hp-regen"
          ? "Rejuvenation и Fitness на реген, затем выживаемость."
          : "Warfare: Fighting Finesse / Master-at-Arms / Wrathful Strikes. Craft: Steed’s Blessing.",
    icon: META_ICONS.champion,
  });

  return nodes;
}
