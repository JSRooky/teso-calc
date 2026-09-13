export type Resource = "magicka" | "stamina" | "health";

export type GoalId =
  | "max-damage"
  | "max-heal"
  | "max-hp-regen"
  | "max-resource-regen"
  | "balanced-dps-sustain"
  | "tank";

export type ArmorWeight = "light" | "medium" | "heavy";

export type ClassId =
  | "dragonknight"
  | "sorcerer"
  | "nightblade"
  | "templar"
  | "warden"
  | "necromancer"
  | "arcanist";

export type SkillKind = "active" | "ultimate" | "passive";

export type StatMods = Partial<{
  magicka: number;
  stamina: number;
  health: number;
  magickaPct: number;
  staminaPct: number;
  healthPct: number;
  spellDamage: number;
  weaponDamage: number;
  spellDamagePct: number;
  weaponDamagePct: number;
  magickaRecovery: number;
  staminaRecovery: number;
  healthRecovery: number;
  magickaRecoveryPct: number;
  staminaRecoveryPct: number;
  healthRecoveryPct: number;
  critChance: number;
  critDamage: number;
  penetration: number;
  physicalResist: number;
  spellResist: number;
  healingDonePct: number;
  damageDonePct: number;
}>;

export type RaceDef = {
  id: string;
  name: string;
  description: string;
  mods: StatMods;
};

export type ClassDef = {
  id: ClassId;
  name: string;
  description: string;
  skillLineIds: string[];
};

export type SkillDef = {
  id: string;
  name: string;
  lineId: string;
  kind: SkillKind;
  morphOf?: string;
  cost?: Resource;
  /** Typical skill: ~0.10 * MaxStat + ~1.05 * MaxDamage */
  maxStatCoeff: number;
  maxDamageCoeff: number;
  ticks?: number;
  duration?: number;
  isHeal?: boolean;
  isDot?: boolean;
  description: string;
  mods?: StatMods;
  /** Rank 1–4 for actives, 1–3 for many passives */
  maxRank: number;
  /** Extra effect per rank after 1 */
  rankMods?: StatMods;
  levelingNote: string;
};

export type SkillLineDef = {
  id: string;
  name: string;
  classId?: ClassId;
  skills: SkillDef[];
};

export type MundusDef = {
  id: string;
  name: string;
  mods: StatMods;
  note: string;
};

export type FoodDef = {
  id: string;
  name: string;
  mods: StatMods;
  note: string;
};
