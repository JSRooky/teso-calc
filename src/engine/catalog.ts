import type { ClassDef, FoodDef, MundusDef, RaceDef } from "./types";
import { skillLines } from "./skills";

export const ATTRIBUTE_POINTS = 64;
export const BASE_MAGICKA = 12000;
export const BASE_STAMINA = 12000;
export const BASE_HEALTH = 16000;
export const MAG_STAM_PER_POINT = 111;
export const HEALTH_PER_POINT = 122;
export const BASE_MAG_RECOVERY = 514;
export const BASE_STAM_RECOVERY = 514;
export const BASE_HEALTH_RECOVERY = 309;
export const BASE_CRIT_DAMAGE = 0.5;

export const races: RaceDef[] = [
  {
    id: "high-elf",
    name: "Высокий эльф",
    description: "Маг: магия, сила заклинаний, реген магии.",
    mods: { magicka: 2000, spellDamage: 258, magickaRecovery: 130 },
  },
  {
    id: "dark-elf",
    name: "Тёмный эльф",
    description: "Гибрид: магия и запас сил, сила оружия и заклинаний.",
    mods: { magicka: 1875, stamina: 1875, spellDamage: 258, weaponDamage: 258 },
  },
  {
    id: "breton",
    name: "Бретон",
    description: "Маг с устойчивостью к заклинаниям и регеном магии.",
    mods: { magicka: 2000, magickaRecovery: 130, spellResist: 2310 },
  },
  {
    id: "khajiit",
    name: "Каджит",
    description: "Крит и восстановление ресурсов.",
    mods: {
      critChance: 0.12,
      magickaRecovery: 90,
      staminaRecovery: 90,
      healthRecovery: 90,
    },
  },
  {
    id: "orc",
    name: "Орк",
    description: "Здоровье, сила оружия, скорость.",
    mods: { health: 1000, weaponDamage: 258, stamina: 1000 },
  },
  {
    id: "nord",
    name: "Норд",
    description: "Танк: здоровье и сопротивления.",
    mods: { health: 1000, physicalResist: 2600, spellResist: 2600 },
  },
  {
    id: "argonian",
    name: "Аргонианин",
    description: "Хил и ресурсы: здоровье, магия, лечение.",
    mods: { health: 1000, magicka: 1000, healingDonePct: 0.06 },
  },
  {
    id: "redguard",
    name: "Редгард",
    description: "Стамина и реген стамины.",
    mods: { stamina: 2000, staminaRecovery: 258 },
  },
  {
    id: "wood-elf",
    name: "Лесной эльф",
    description: "Стамина, пробитие, реген стамины.",
    mods: { stamina: 2000, staminaRecovery: 258, penetration: 950 },
  },
  {
    id: "imperial",
    name: "Имперец",
    description: "Здоровье и стамина.",
    mods: { health: 2000, stamina: 2000 },
  },
];

export const classes: ClassDef[] = [
  {
    id: "dragonknight",
    name: "Рыцарь-дракон",
    description: "DoT, броня, огонь. Хорош в дамаге и танке.",
    skillLineIds: ["dk-flame", "dk-earth", "dk-draconic"],
  },
  {
    id: "sorcerer",
    name: "Чародей",
    description: "Петы, молнии, щиты. Сильный маг-DPS и соло.",
    skillLineIds: ["sorc-daedric", "sorc-storm", "sorc-dark"],
  },
  {
    id: "nightblade",
    name: "Клинок ночи",
    description: "Крит, вампиризм, мобильность. Высокий burst DPS.",
    skillLineIds: ["nb-assassin", "nb-shadow", "nb-siphon"],
  },
  {
    id: "templar",
    name: "Храмовник",
    description: "Лучи, хил, копья. Универсальный хилер и DPS.",
    skillLineIds: ["templar-aedric", "templar-dawn", "templar-restoring"],
  },
  {
    id: "warden",
    name: "Хранитель",
    description: "Животные, лёд, природа. Хилер, танк, DPS.",
    skillLineIds: ["warden-animal", "warden-green", "warden-winter"],
  },
  {
    id: "necromancer",
    name: "Некромант",
    description: "Трупы, DoT, взрывы. Сильный AoE и хил.",
    skillLineIds: ["necro-grave", "necro-bone", "necro-living"],
  },
  {
    id: "arcanist",
    name: "Арканист",
    description: "Клинки судьбы, лучи, щиты. Стабильный парсе.",
    skillLineIds: ["arc-herald", "arc-soldier", "arc-curative"],
  },
];

export const mundus: MundusDef[] = [
  { id: "warrior", name: "Воин", mods: { weaponDamage: 238 }, note: "Сила оружия." },
  { id: "mage", name: "Маг", mods: { spellDamage: 238 }, note: "Сила заклинаний." },
  { id: "thief", name: "Вор", mods: { critChance: 0.121 }, note: "Шанс крита." },
  { id: "serpent", name: "Змей", mods: { staminaRecovery: 238 }, note: "Реген стамины." },
  { id: "atronach", name: "Атронах", mods: { magickaRecovery: 238 }, note: "Реген магии." },
  { id: "lord", name: "Лорд", mods: { health: 2225 }, note: "Макс. здоровье." },
  { id: "lady", name: "Леди", mods: { physicalResist: 2744, spellResist: 2744 }, note: "Сопротивления." },
  { id: "steed", name: "Конь", mods: { healthRecovery: 238 }, note: "Реген здоровья." },
  { id: "ritual", name: "Ритуал", mods: { healingDonePct: 0.08 }, note: "Исходящее лечение." },
  { id: "lover", name: "Любовник", mods: { penetration: 2744 }, note: "Пробитие." },
];

export const foods: FoodDef[] = [
  {
    id: "bewitched-sugar-skulls",
    name: "Зачарованные сахарные черепа",
    mods: { health: 4620, magicka: 4250, stamina: 4250 },
    note: "Максимум всех ресурсов. Для парса.",
  },
  {
    id: "ghastly-eye-bowl",
    name: "Миска призрачных глаз",
    mods: { magicka: 4592, magickaRecovery: 459 },
    note: "Магия + реген магии.",
  },
  {
    id: "lava-foot-soup",
    name: "Суп из лавовых ног",
    mods: { stamina: 4592, staminaRecovery: 459 },
    note: "Стамина + реген стамины.",
  },
  {
    id: "dubious-camoran",
    name: "Сомнительный каморанский трон",
    mods: { health: 5395, magickaRecovery: 493, staminaRecovery: 493 },
    note: "ХП + оба регена. Для соло/танка.",
  },
  {
    id: "witchmothers-potent",
    name: "Зелье ведьмы",
    mods: { health: 4592, magicka: 4308, magickaRecovery: 394 },
    note: "Хил/маг: ХП, магия, реген магии.",
  },
  {
    id: "orzorgas-red-frothgar",
    name: "Красный фротгар Орзорги",
    mods: { health: 5395, healthRecovery: 525 },
    note: "Макс. здоровье и реген ХП.",
  },
];

export function skillLinesForClass(classId: string) {
  return skillLines.filter((l) => l.classId === classId);
}

export function weaponSkillLines() {
  return skillLines.filter((l) => !l.classId);
}

export function allSkills() {
  return skillLines.flatMap((l) => l.skills);
}
