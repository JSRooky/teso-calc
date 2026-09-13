import { allSkills } from "./catalog";
import { barSkillIds, type BuildInput, type DerivedStats } from "./compute";
import type { SkillDef } from "./types";

export type PotionDef = {
  id: string;
  name: string;
  magicka: number;
  stamina: number;
  note: string;
};

/** Gold CP160 restore values (UESP). Cooldown in ESO is 45s unless a set reduces it. */
export const potions: PotionDef[] = [
  { id: "none", name: "Без банки", magicka: 0, stamina: 0, note: "Только реген с листа." },
  {
    id: "essence-mag",
    name: "Эссенция магии",
    magicka: 7584,
    stamina: 0,
    note: "Классика мага. Кулдаун 45 с.",
  },
  {
    id: "essence-stam",
    name: "Эссенция запаса сил",
    magicka: 0,
    stamina: 7584,
    note: "Классика стама. Кулдаун 45 с.",
  },
  {
    id: "tri",
    name: "Тройная эссенция (хил+мага+стам)",
    magicka: 2392,
    stamina: 2392,
    note: "Меньше ресурса, зато оба пула и ХП.",
  },
  {
    id: "spell-power",
    name: "Эссенция силы заклинаний",
    magicka: 7584,
    stamina: 0,
    note: "Магия + Major Sorcery / Intellect. Включите баффы выше.",
  },
  {
    id: "weapon-power",
    name: "Эссенция силы оружия",
    magicka: 0,
    stamina: 7584,
    note: "Стамина + Major Brutality / Endurance.",
  },
];

type CostRow = {
  magicka: number;
  stamina: number;
  interval: number;
  channel?: boolean;
};

const COSTS: Record<string, CostRow> = {
  "lava-whip": { magicka: 2295, stamina: 0, interval: 1.1 },
  eruption: { magicka: 270, stamina: 0, interval: 15 },
  "obsidian-shield": { magicka: 4050, stamina: 0, interval: 20 },
  "coagulating-blood": { magicka: 4320, stamina: 0, interval: 12 },
  "crystal-frags": { magicka: 2700, stamina: 0, interval: 1.1 },
  "bound-aegis": { magicka: 4050, stamina: 0, interval: 8 },
  "mystic-orb": { magicka: 2970, stamina: 0, interval: 8 },
  "power-surge": { magicka: 4050, stamina: 0, interval: 33 },
  "hardened-ward": { magicka: 4050, stamina: 0, interval: 8 },
  "surprise-attack": { magicka: 0, stamina: 2295, interval: 1.1 },
  "grim-focus": { magicka: 1890, stamina: 0, interval: 20 },
  "refreshing-path": { magicka: 3510, stamina: 0, interval: 10 },
  "puncturing-sweep": { magicka: 2295, stamina: 0, interval: 1.1 },
  "vampire-sacrifice": { magicka: 2950, stamina: 0, interval: 8 },
  "breath-of-life": { magicka: 4590, stamina: 0, interval: 6 },
  "cutting-dive": { magicka: 0, stamina: 2295, interval: 1.1 },
  "soothing-spores": { magicka: 0, stamina: 3902, interval: 8 },
  "fetcher-infection": { magicka: 2970, stamina: 0, interval: 20 },
  blastbones: { magicka: 2700, stamina: 0, interval: 3.5 },
  "bone-armor": { magicka: 2700, stamina: 0, interval: 20 },
  "render-flesh": { magicka: 4320, stamina: 0, interval: 6 },
  fatecarver: { magicka: 450, stamina: 0, interval: 4.5, channel: true },
  "writhing-runeblades": { magicka: 2700, stamina: 0, interval: 1.1 },
  runeguard: { magicka: 3510, stamina: 0, interval: 20 },
  "reconstructive-domain": { magicka: 3780, stamina: 0, interval: 20 },
  "crushing-shock": { magicka: 2430, stamina: 0, interval: 1.1 },
  "wall-of-elements": { magicka: 2970, stamina: 0, interval: 10 },
  "healing-springs": { magicka: 3510, stamina: 0, interval: 10 },
  "combat-prayer": { magicka: 4590, stamina: 0, interval: 8 },
  "endless-hail": { magicka: 0, stamina: 2700, interval: 13 },
  "poison-injection": { magicka: 0, stamina: 2700, interval: 20 },
  stampede: { magicka: 0, stamina: 4590, interval: 15 },
  "rapid-strikes": { magicka: 0, stamina: 2430, interval: 1.1 },
  "puncturing-remedy": { magicka: 0, stamina: 1350, interval: 15 },
};

export type SkillSpend = {
  skill: SkillDef;
  magicka: number;
  stamina: number;
  interval: number;
  magickaPerSec: number;
  staminaPerSec: number;
  role: "spam" | "channel" | "maintain" | "ultimate";
};

export type SustainResult = {
  skills: SkillSpend[];
  magickaSpend: number;
  staminaSpend: number;
  magickaRegen: number;
  staminaRegen: number;
  magickaPotion: number;
  staminaPotion: number;
  magickaNet: number;
  staminaNet: number;
  magickaEmptyIn: number | null;
  staminaEmptyIn: number | null;
};

function roleOf(cost: CostRow, skill: SkillDef): SkillSpend["role"] {
  if (skill.kind === "ultimate") return "ultimate";
  if (cost.channel) return "channel";
  if (cost.interval <= 1.5) return "spam";
  return "maintain";
}

function perSec(amount: number, interval: number, channel?: boolean) {
  if (interval <= 0) return 0;
  if (channel) return amount;
  return amount / interval;
}

export function computeSustain(
  input: BuildInput,
  stats: DerivedStats,
  potionId: string,
  potionCooldown: number,
): SustainResult {
  const potion = potions.find((p) => p.id === potionId) ?? potions[0];
  const cd = Math.max(20, potionCooldown);
  const front = new Set(barSkillIds(input.frontBar));
  const back = new Set(barSkillIds(input.backBar));
  const ids = [...new Set([...front, ...back])];

  const raw: SkillSpend[] = [];
  for (const id of ids) {
    const skill = allSkills().find((s) => s.id === id);
    if (!skill || skill.kind === "passive") continue;
    const cost = COSTS[id];
    if (!cost) {
      if (skill.kind === "ultimate") {
        raw.push({
          skill,
          magicka: 0,
          stamina: 0,
          interval: 20,
          magickaPerSec: 0,
          staminaPerSec: 0,
          role: "ultimate",
        });
      }
      continue;
    }
    raw.push({
      skill,
      magicka: cost.magicka,
      stamina: cost.stamina,
      interval: cost.interval,
      magickaPerSec: perSec(cost.magicka, cost.interval, cost.channel),
      staminaPerSec: perSec(cost.stamina, cost.interval, cost.channel),
          role: roleOf(cost, skill),
    });
  }

  const frontSpenders = raw.filter((s) => front.has(s.skill.id) && (s.role === "spam" || s.role === "channel"));
  const primary =
    frontSpenders.find((s) => s.role === "channel") ??
    frontSpenders.sort((a, b) => b.magicka + b.stamina - (a.magicka + a.stamina))[0];

  const skills = raw.map((s) => {
    if (s.role === "ultimate") return { ...s, magickaPerSec: 0, staminaPerSec: 0 };
    const onFront = front.has(s.skill.id);
    const onlyBack = back.has(s.skill.id) && !onFront;
    if (s.role === "spam" && primary && s.skill.id !== primary.skill.id) {
      const interval = onlyBack ? 12 : 6;
      return {
        ...s,
        interval,
        magickaPerSec: perSec(s.magicka, interval),
        staminaPerSec: perSec(s.stamina, interval),
      };
    }
    if (s.role === "channel" && primary && s.skill.id !== primary.skill.id) {
      const interval = 12;
      return {
        ...s,
        interval,
        magickaPerSec: perSec(s.magicka * s.interval, interval),
        staminaPerSec: perSec(s.stamina * s.interval, interval),
      };
    }
    return s;
  });

  const magickaSpend = skills.reduce((n, s) => n + s.magickaPerSec, 0);
  const staminaSpend = skills.reduce((n, s) => n + s.staminaPerSec, 0);
  const magickaRegen = stats.magickaRecovery / 2;
  const staminaRegen = stats.staminaRecovery / 2;
  const magickaPotion = potion.magicka / cd;
  const staminaPotion = potion.stamina / cd;
  const magickaNet = magickaRegen + magickaPotion - magickaSpend;
  const staminaNet = staminaRegen + staminaPotion - staminaSpend;

  const magickaEmptyIn = magickaNet >= 0 ? null : stats.magicka / -magickaNet;
  const staminaEmptyIn = staminaNet >= 0 ? null : stats.stamina / -staminaNet;

  return {
    skills,
    magickaSpend,
    staminaSpend,
    magickaRegen,
    staminaRegen,
    magickaPotion,
    staminaPotion,
    magickaNet,
    staminaNet,
    magickaEmptyIn,
    staminaEmptyIn,
  };
}
