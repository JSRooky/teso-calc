import type { GoalId } from "./types";

export type GoalDef = {
  id: GoalId;
  name: string;
  tagline: string;
  /** Weights for optimizer / score */
  weights: {
    damage: number;
    heal: number;
    hpRegen: number;
    resourceRegen: number;
    health: number;
    resist: number;
  };
  preferredGear: "mag-dps" | "stam-dps" | "healer" | "tank";
  preferredMundus: string[];
  preferredFood: string[];
};

export const goals: GoalDef[] = [
  {
    id: "max-damage",
    name: "Максимальный урон",
    tagline: "Пул ресурса + сила оружия/заклинаний, крит, пробитие.",
    weights: { damage: 1, heal: 0, hpRegen: 0, resourceRegen: 0.05, health: 0.05, resist: 0 },
    preferredGear: "mag-dps",
    preferredMundus: ["thief", "lover", "mage", "warrior"],
    preferredFood: ["bewitched-sugar-skulls"],
  },
  {
    id: "max-heal",
    name: "Максимальное лечение",
    tagline: "Магия, сила заклинаний, исходящий хил.",
    weights: { damage: 0.15, heal: 1, hpRegen: 0.15, resourceRegen: 0.35, health: 0.2, resist: 0 },
    preferredGear: "healer",
    preferredMundus: ["ritual", "atronach", "mage"],
    preferredFood: ["witchmothers-potent", "ghastly-eye-bowl"],
  },
  {
    id: "max-hp-regen",
    name: "Максимальный реген ХП",
    tagline: "Mundus «Конь», еда Орзорги, пассивки хила.",
    weights: { damage: 0, heal: 0.2, hpRegen: 1, resourceRegen: 0.1, health: 0.35, resist: 0.1 },
    preferredGear: "tank",
    preferredMundus: ["steed"],
    preferredFood: ["orzorgas-red-frothgar"],
  },
  {
    id: "max-resource-regen",
    name: "Максимальный реген ресурсов",
    tagline: "Реген магии и стамины, еда на восстановление.",
    weights: { damage: 0.1, heal: 0, hpRegen: 0.1, resourceRegen: 1, health: 0.1, resist: 0 },
    preferredGear: "healer",
    preferredMundus: ["atronach", "serpent"],
    preferredFood: ["dubious-camoran", "ghastly-eye-bowl", "lava-foot-soup"],
  },
  {
    id: "balanced-dps-sustain",
    name: "Баланс урона и сустейна",
    tagline: "Достаточно DPS без голодания по ресурсам.",
    weights: { damage: 0.7, heal: 0.05, hpRegen: 0.1, resourceRegen: 0.55, health: 0.2, resist: 0.05 },
    preferredGear: "mag-dps",
    preferredMundus: ["thief", "atronach"],
    preferredFood: ["ghastly-eye-bowl", "bewitched-sugar-skulls"],
  },
  {
    id: "tank",
    name: "Танк / выживаемость",
    tagline: "Здоровье, сопротивления, реген.",
    weights: { damage: 0.05, heal: 0.15, hpRegen: 0.4, resourceRegen: 0.35, health: 1, resist: 0.8 },
    preferredGear: "tank",
    preferredMundus: ["lord", "lady", "steed"],
    preferredFood: ["dubious-camoran", "orzorgas-red-frothgar"],
  },
];
