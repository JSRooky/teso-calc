import type { StatMods } from "./types";

export function emptyMods(): Required<StatMods> {
  return {
    magicka: 0,
    stamina: 0,
    health: 0,
    magickaPct: 0,
    staminaPct: 0,
    healthPct: 0,
    spellDamage: 0,
    weaponDamage: 0,
    spellDamagePct: 0,
    weaponDamagePct: 0,
    magickaRecovery: 0,
    staminaRecovery: 0,
    healthRecovery: 0,
    magickaRecoveryPct: 0,
    staminaRecoveryPct: 0,
    healthRecoveryPct: 0,
    critChance: 0,
    critDamage: 0,
    penetration: 0,
    physicalResist: 0,
    spellResist: 0,
    healingDonePct: 0,
    damageDonePct: 0,
  };
}

export function addMods(target: Required<StatMods>, mods?: StatMods, rank = 1, rankMods?: StatMods) {
  if (!mods) return;
  const extra = rank > 1 && rankMods ? rank - 1 : 0;
  for (const key of Object.keys(mods) as (keyof StatMods)[]) {
    const base = mods[key] ?? 0;
    const per = extra && rankMods ? (rankMods[key] ?? 0) : 0;
    (target[key] as number) += base + per * extra;
  }
}

export function scaleMods(mods: StatMods, factor: number): StatMods {
  const out: StatMods = {};
  for (const key of Object.keys(mods) as (keyof StatMods)[]) {
    const v = mods[key];
    if (v !== undefined) (out[key] as number) = v * factor;
  }
  return out;
}
