import { addMods, emptyMods, scaleMods } from "./mods";
import type { ArmorWeight, StatMods } from "./types";

export type SetSource =
  | "craft"
  | "overland"
  | "dungeon"
  | "trial"
  | "arena"
  | "monster"
  | "mythic"
  | "pvp";

export const SET_SOURCE_LABEL: Record<SetSource, string> = {
  craft: "Крафт",
  overland: "Оверленд (дроп)",
  dungeon: "Данж (дроп)",
  trial: "Триал (дроп)",
  arena: "Арена (дроп)",
  monster: "Монстр-сет (дроп)",
  mythic: "Мифик (антиквариат)",
  pvp: "ПвП (дроп/награды)",
};

export function isCrafted(source: SetSource) {
  return source === "craft";
}

export type SlotId =
  | "head"
  | "shoulders"
  | "chest"
  | "hands"
  | "waist"
  | "legs"
  | "feet"
  | "neck"
  | "ring1"
  | "ring2"
  | "frontMain"
  | "frontOff"
  | "backMain"
  | "backOff";

export const ARMOR_SLOTS: SlotId[] = [
  "head",
  "shoulders",
  "chest",
  "hands",
  "waist",
  "legs",
  "feet",
];
export const JEWEL_SLOTS: SlotId[] = ["neck", "ring1", "ring2"];
export const WEAPON_SLOTS: SlotId[] = ["frontMain", "frontOff", "backMain", "backOff"];

export const SLOT_LABEL: Record<SlotId, string> = {
  head: "Голова",
  shoulders: "Плечи",
  chest: "Грудь",
  hands: "Перчатки",
  waist: "Пояс",
  legs: "Ноги",
  feet: "Сапоги",
  neck: "Шея",
  ring1: "Кольцо 1",
  ring2: "Кольцо 2",
  frontMain: "Оружие · фронт",
  frontOff: "Оффхенд · фронт",
  backMain: "Оружие · бэк",
  backOff: "Оффхенд · бэк",
};

export type WeaponKind = "inferno" | "lightning" | "frost" | "resto" | "bow" | "twohand" | "onehand" | "shield";

export const WEAPON_KIND_LABEL: Record<WeaponKind, string> = {
  inferno: "Посох огня",
  lightning: "Посох молний",
  frost: "Посох льда",
  resto: "Посох восстановления",
  bow: "Лук",
  twohand: "Двуручное",
  onehand: "Одноручное",
  shield: "Щит",
};

export type Piece = {
  setId: string;
  traitId: string;
  enchantId: string;
  weight?: ArmorWeight;
  weaponKind?: WeaponKind;
};

export type Loadout = Record<SlotId, Piece>;

export type SetDef = {
  id: string;
  name: string;
  source: SetSource;
  where: string;
  maxPieces: 1 | 2 | 5;
  bonuses: Partial<Record<1 | 2 | 3 | 4 | 5, StatMods>>;
  note: string;
};

export type TraitDef = {
  id: string;
  name: string;
  slots: "armor" | "jewelry" | "weapon" | "any";
  mods: StatMods;
  /** Extra enchant potency, e.g. Infused armor 0.25, weapon 0.30 */
  enchantBonus?: number;
  /** Mundus bonus per armor piece, Divines ~0.091 */
  mundusBonus?: number;
};

export type EnchantDef = {
  id: string;
  name: string;
  slots: "armor" | "jewelry" | "weapon" | "any";
  mods: StatMods;
};

export const SLOT_SIZE: Record<SlotId, number> = {
  head: 0.7,
  shoulders: 0.7,
  chest: 1,
  hands: 0.55,
  waist: 0.55,
  legs: 0.95,
  feet: 0.55,
  neck: 1,
  ring1: 1,
  ring2: 1,
  frontMain: 1,
  frontOff: 0.55,
  backMain: 1,
  backOff: 0.55,
};

function set(
  id: string,
  name: string,
  source: SetSource,
  where: string,
  maxPieces: 1 | 2 | 5,
  bonuses: SetDef["bonuses"],
  note: string,
): SetDef {
  return { id, name, source, where, maxPieces, bonuses, note };
}

export const sets: SetDef[] = [
  set("none", "Без сета", "craft", "—", 5, {}, "Пустой слот / несетный крафт."),
  set(
    "julianos",
    "Закон Джулианоса",
    "craft",
    "Ремесло (чертёж в Краглорне)",
    5,
    {
      2: { magicka: 1096 },
      3: { spellDamage: 129 },
      4: { magicka: 1096 },
      5: { spellDamage: 299 },
    },
    "Классический крафт-маг. Можно собрать в любой вес.",
  ),
  set(
    "hunding",
    "Ярость Хандинга",
    "craft",
    "Ремесло (Бангкорай)",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { stamina: 1096 },
      5: { weaponDamage: 299 },
    },
    "Классический крафт-стам.",
  ),
  set(
    "orders-wrath",
    "Гнев Ордена",
    "craft",
    "Ремесло (High Isle)",
    5,
    {
      2: { magicka: 1096, stamina: 1096 },
      3: { critChance: 0.036 },
      4: { health: 1206 },
      5: { critChance: 0.086, critDamage: 0.08 },
    },
    "Крафт на крит. Универсален для мага и стама.",
  ),
  set(
    "shacklebreaker",
    "Разрушитель оков",
    "craft",
    "Ремесло (Вварденфелл)",
    5,
    {
      2: { magicka: 1096, stamina: 1096 },
      3: { magickaRecovery: 129, staminaRecovery: 129 },
      4: { health: 1206 },
      5: { magicka: 1718, stamina: 1718, spellDamage: 148, weaponDamage: 148 },
    },
    "Гибрид и сустейн. Хорош на старте.",
  ),
  set(
    "fortified-brass",
    "Укреплённая латунь",
    "craft",
    "Ремесло (Заводной город)",
    5,
    {
      2: { health: 1206 },
      3: { physicalResist: 1487, spellResist: 1487 },
      4: { health: 1206 },
      5: { physicalResist: 3460, spellResist: 3460 },
    },
    "Крафт-танк на сопротивления.",
  ),
  set(
    "willows-path",
    "Путь ивы",
    "craft",
    "Ремесло (Малбал Тор)",
    5,
    {
      2: { magicka: 1096, stamina: 1096 },
      3: { magickaRecovery: 129, staminaRecovery: 129, healthRecovery: 129 },
      4: { health: 1206 },
      5: { magickaRecoveryPct: 0.16, staminaRecoveryPct: 0.16, healthRecoveryPct: 0.16 },
    },
    "Крафт на все регены.",
  ),
  set(
    "kagrenacs-hope",
    "Надежда Кагренака",
    "craft",
    "Ремесло (Стоунфолз)",
    5,
    {
      2: { magicka: 1096 },
      3: { magickaRecovery: 129 },
      4: { spellDamage: 129 },
      5: { healingDonePct: 0.05, magicka: 1096 },
    },
    "Крафт-хилер / маг с хилом.",
  ),
  set(
    "heartland",
    "Завоеватель Хартленда",
    "craft",
    "Ремесло (Золотой Берег)",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { staminaRecovery: 129 },
      5: { weaponDamage: 200, stamina: 1096 },
    },
    "Крафт стам с регеном.",
  ),
  set(
    "wretched-vitality",
    "Жалкая жизненность",
    "craft",
    "Ремесло (The Deadlands)",
    5,
    {
      2: { magickaRecovery: 129, staminaRecovery: 129 },
      3: { magicka: 1096, stamina: 1096 },
      4: { health: 1206 },
      5: { magickaRecovery: 350, staminaRecovery: 350 },
    },
    "Крафт на сустейн в бою.",
  ),
  set(
    "torugs-pact",
    "Пакт Торуга",
    "craft",
    "Ремесло (Истмарш)",
    5,
    {
      2: { health: 1206 },
      3: { spellDamage: 129, weaponDamage: 129 },
      4: { health: 1206 },
      5: { spellDamage: 200, weaponDamage: 200 },
    },
    "Крафт, усиливает зачарования оружия (упрощённо: +сила).",
  ),
  set(
    "mothers-sorrow",
    "Печаль матери",
    "overland",
    "Дешаан, боссы и дельвы",
    5,
    {
      2: { magicka: 1096 },
      3: { critChance: 0.036 },
      4: { magicka: 1096 },
      5: { critChance: 0.086 },
    },
    "Дроп-маг на крит. Часто на бижутерии.",
  ),
  set(
    "spriggans",
    "Плач сприггана",
    "overland",
    "Бангкорай",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { stamina: 1096 },
      5: { penetration: 3450 },
    },
    "Оверленд-стам, пробитие.",
  ),
  set(
    "deadly-strike",
    "Смертельный удар",
    "pvp",
    "Сиродил / награды войны",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { stamina: 1096 },
      5: { damageDonePct: 0.08 },
    },
    "ПвП-дроп, силён на каналы и DoT (Fatecarver).",
  ),
  set(
    "relequen",
    "Оружие Релеквена",
    "trial",
    "Cloudrest (триал)",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { critChance: 0.036 },
      5: { damageDonePct: 0.1 },
    },
    "Триал-стам. Только выбивается.",
  ),
  set(
    "whorl",
    "Вихрь глубин",
    "trial",
    "Dreadsail Reef",
    5,
    {
      2: { magicka: 1096 },
      3: { spellDamage: 129 },
      4: { magicka: 1096 },
      5: { damageDonePct: 0.08 },
    },
    "Триал-маг, AoE.",
  ),
  set(
    "coral-riptide",
    "Коралловый прилив",
    "trial",
    "Dreadsail Reef",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { stamina: 1096 },
      5: { weaponDamagePct: 0.12 },
    },
    "Триал-стам от недостающей стамины (упрощено как % WD).",
  ),
  set(
    "siroria",
    "Совершенство Сирории",
    "trial",
    "Cloudrest",
    5,
    {
      2: { magicka: 1096 },
      3: { spellDamage: 129 },
      4: { magicka: 1096 },
      5: { spellDamagePct: 0.08 },
    },
    "Триал-маг, стаки на месте.",
  ),
  set(
    "spell-power-cure",
    "Исцеление силы заклинаний",
    "dungeon",
    "White-Gold Tower",
    5,
    {
      2: { magicka: 1096 },
      3: { magickaRecovery: 129 },
      4: { magicka: 1096 },
      5: { spellDamagePct: 0.08, healingDonePct: 0.04 },
    },
    "Данж-хилер. Бафф группе (у вас — себе).",
  ),
  set(
    "jorvuld",
    "Наставление Йорвульда",
    "dungeon",
    "Scalecaller Peak",
    5,
    {
      2: { magicka: 1096 },
      3: { healingDonePct: 0.04 },
      4: { magickaRecovery: 129 },
      5: { healingDonePct: 0.06, magickaRecovery: 200 },
    },
    "Данж-хилер, удлиняет баффы (упрощено в хил/реген).",
  ),
  set(
    "turning-tide",
    "Поворот прилива",
    "dungeon",
    "Shipwright's Regret",
    5,
    {
      2: { health: 1206 },
      3: { magicka: 1096 },
      4: { physicalResist: 1487, spellResist: 1487 },
          5: { physicalResist: 2000, spellResist: 2000 },
    },
    "Данж-танк. В расчёте — выживаемость; Major Breach группе не суммируется в ваш DPS.",
  ),
  set(
    "powerful-assault",
    "Мощный натиск",
    "pvp",
    "Сиродил / Imperial Sewers",
    5,
    {
      2: { stamina: 1096 },
      3: { weaponDamage: 129 },
      4: { stamina: 1096 },
      5: { weaponDamage: 307, spellDamage: 307 },
    },
    "ПвП-дроп, бафф WD/SD группе.",
  ),
  set(
    "crimson-oath",
    "Багровая клятва",
    "dungeon",
    "The Dread Cellar",
    5,
    {
      2: { health: 1206 },
      3: { magicka: 1096, stamina: 1096 },
      4: { health: 1206 },
      5: { penetration: 3540 },
    },
    "Данж-танк, пробитие группе (у вас в пен).",
  ),
  set(
    "arena-masters",
    "Мастерство арены",
    "arena",
    "Dragonstar / Maelstrom / Vateshran",
    5,
    {
      2: { magicka: 1096, stamina: 1096 },
      3: { spellDamage: 129, weaponDamage: 129 },
      4: { magicka: 877, stamina: 877 },
      5: { spellDamage: 200, weaponDamage: 200 },
    },
    "Оружие арен — только дроп. Упрощённые статы оружия арены.",
  ),
  set(
    "slimecraw",
    "Слаймкроу",
    "monster",
    "Wayrest Sewers I (голова), Undaunted (плечи)",
    2,
    {
      1: { critChance: 0.015 },
      2: { critChance: 0.036, magickaRecovery: 129, staminaRecovery: 129 },
    },
    "Монстр на крит. Голова — босс, плечи — ключи Неустрашимых.",
  ),
  set(
    "kragh",
    "Кра'гх",
    "monster",
    "Fungal Grotto I",
    2,
    {
      1: { penetration: 1487 },
      2: { penetration: 1631, weaponDamage: 129, spellDamage: 129 },
    },
    "Монстр на пробитие.",
  ),
  set(
    "bloodspawn",
    "Кровавое отродье",
    "monster",
    "Spindleclutch II",
    2,
    {
      1: { staminaRecovery: 129 },
      2: { physicalResist: 3731, spellResist: 3731, staminaRecovery: 200 },
    },
    "Монстр-танк: ульт и сопротивления.",
  ),
  set(
    "earthgore",
    "Землекров",
    "monster",
    "Bloodroot Forge",
    2,
    {
      1: { healingDonePct: 0.02 },
      2: { healingDonePct: 0.04, health: 1206 },
    },
    "Монстр-хилер, бурст-хил (упрощено в % хила).",
  ),
  set(
    "engine-guardian",
    "Страж механизма",
    "monster",
    "Darkshade Caverns II",
    2,
    {
      1: { magickaRecovery: 129 },
      2: { magickaRecovery: 250, staminaRecovery: 250, healthRecovery: 250 },
    },
    "Монстр на сустейн (прок сферы).",
  ),
  set(
    "oakensoul",
    "Дубовая душа",
    "mythic",
    "Антиквариат (1 предмет)",
    1,
    {
      1: {
        spellDamagePct: 0.1,
        weaponDamagePct: 0.1,
        magickaRecoveryPct: 0.1,
        staminaRecoveryPct: 0.1,
        healthRecoveryPct: 0.1,
        critChance: 0.06,
      },
    },
    "Мифик на один бар: пачка Major/Minor. Нельзя носить два мифика.",
  ),
  set(
    "pale-order",
    "Перстень Бледного Ордена",
    "mythic",
    "Антиквариат",
    1,
    {
      1: { healingDonePct: 0.18, health: 1000 },
    },
    "Мифик соло-хил с лёгких атак. Не в группе.",
  ),
  set(
    "death-dealers-fete",
    "Пир торговца смертью",
    "mythic",
    "Антиквариат",
    1,
    {
      1: { magicka: 1400, stamina: 1400, health: 1400 },
    },
    "Мифик: стаки ресурсов в бою (упрощено как плоский пул).",
  ),
];

export const traits: TraitDef[] = [
  { id: "divines", name: "Божественный", slots: "armor", mods: {}, mundusBonus: 0.091 },
  { id: "infused-armor", name: "Насыщенный (броня)", slots: "armor", mods: {}, enchantBonus: 0.25 },
  { id: "impenetrable", name: "Непробиваемый", slots: "armor", mods: { physicalResist: 300, spellResist: 300 } },
  { id: "reinforced", name: "Укреплённый", slots: "armor", mods: { physicalResist: 900, spellResist: 900 } },
  { id: "wellfitted", name: "По фигуре", slots: "armor", mods: {} },
  { id: "training-armor", name: "Обучение (броня)", slots: "armor", mods: {} },
  { id: "nirn-armor", name: "Нирнхонд (броня)", slots: "armor", mods: { physicalResist: 600, spellResist: 600 } },
  { id: "bloodthirsty", name: "Кровожадный", slots: "jewelry", mods: { spellDamage: 120, weaponDamage: 120 } },
  { id: "infused-jewel", name: "Насыщенный (бижу)", slots: "jewelry", mods: {}, enchantBonus: 0.6 },
  { id: "swift", name: "Стремительный", slots: "jewelry", mods: {} },
  { id: "protective", name: "Защитный", slots: "jewelry", mods: { physicalResist: 1578, spellResist: 1578 } },
  { id: "triune", name: "Троичный", slots: "jewelry", mods: { magicka: 273, stamina: 273, health: 301 } },
  { id: "arcane", name: "Тайный", slots: "jewelry", mods: { magicka: 877 } },
  { id: "robust", name: "Крепкий", slots: "jewelry", mods: { stamina: 877 } },
  { id: "healthy", name: "Здоровый", slots: "jewelry", mods: { health: 965 } },
  { id: "precise", name: "Точный", slots: "weapon", mods: { critChance: 0.036 } },
  { id: "nirn-weapon", name: "Нирнхонд (оружие)", slots: "weapon", mods: { spellDamage: 206, weaponDamage: 206 } },
  { id: "sharpened", name: "Заточенный", slots: "weapon", mods: { penetration: 1638 } },
  { id: "infused-weapon", name: "Насыщенный (оружие)", slots: "weapon", mods: {}, enchantBonus: 0.3 },
  { id: "defending", name: "Оборонительный", slots: "weapon", mods: { physicalResist: 1376, spellResist: 1376 } },
  { id: "charged", name: "Заряженный", slots: "weapon", mods: {} },
  { id: "decisive", name: "Решающий", slots: "weapon", mods: {} },
];

export const enchants: EnchantDef[] = [
  { id: "armor-mag", name: "Глиф магии", slots: "armor", mods: { magicka: 1096 } },
  { id: "armor-stam", name: "Глиф запаса сил", slots: "armor", mods: { stamina: 1096 } },
  { id: "armor-hp", name: "Глиф здоровья", slots: "armor", mods: { health: 1206 } },
  { id: "armor-prism", name: "Призматический глиф", slots: "armor", mods: { magicka: 478, stamina: 478, health: 526 } },
  { id: "jewel-sd", name: "Глиф силы заклинаний", slots: "jewelry", mods: { spellDamage: 174 } },
  { id: "jewel-wd", name: "Глиф силы оружия", slots: "jewelry", mods: { weaponDamage: 174 } },
  { id: "jewel-mag", name: "Глиф магии (бижу)", slots: "jewelry", mods: { magicka: 877 } },
  { id: "jewel-stam", name: "Глиф стамины (бижу)", slots: "jewelry", mods: { stamina: 877 } },
  { id: "jewel-hp", name: "Глиф здоровья (бижу)", slots: "jewelry", mods: { health: 965 } },
  { id: "jewel-magrec", name: "Глиф регена магии", slots: "jewelry", mods: { magickaRecovery: 169 } },
  { id: "jewel-stamrec", name: "Глиф регена стамины", slots: "jewelry", mods: { staminaRecovery: 169 } },
  { id: "jewel-hprec", name: "Глиф регена ХП", slots: "jewelry", mods: { healthRecovery: 169 } },
  { id: "jewel-flame", name: "Глиф огненного урона", slots: "jewelry", mods: { spellDamage: 120 } },
  { id: "wep-absorb-hp", name: "Поглощение здоровья", slots: "weapon", mods: { healingDonePct: 0.02 } },
  { id: "wep-flame", name: "Оружие пламени", slots: "weapon", mods: { spellDamage: 0, damageDonePct: 0.02 } },
  { id: "wep-shock", name: "Оружие молний", slots: "weapon", mods: { damageDonePct: 0.015 } },
  { id: "wep-poison", name: "Оружие яда", slots: "weapon", mods: { damageDonePct: 0.015 } },
  { id: "wep-berserker", name: "Берсерк (урон)", slots: "weapon", mods: { spellDamage: 348, weaponDamage: 348 } },
  { id: "wep-crushe", name: "Сокрушение (пробитие)", slots: "weapon", mods: { penetration: 2100 } },
  { id: "wep-weakening", name: "Ослабление", slots: "weapon", mods: {} },
  { id: "wep-absorb-mag", name: "Поглощение магии", slots: "weapon", mods: { magickaRecovery: 80 } },
  { id: "wep-absorb-stam", name: "Поглощение стамины", slots: "weapon", mods: { staminaRecovery: 80 } },
  { id: "shield-hp", name: "Глиф здоровья (щит)", slots: "weapon", mods: { health: 1206 } },
];

export function slotKind(slot: SlotId): "armor" | "jewelry" | "weapon" {
  if (ARMOR_SLOTS.includes(slot)) return "armor";
  if (JEWEL_SLOTS.includes(slot)) return "jewelry";
  return "weapon";
}

export function usesOffhand(kind?: WeaponKind) {
  return kind === "onehand" || kind === "shield";
}

export function isTwoHanded(kind?: WeaponKind) {
  return kind === "inferno" || kind === "lightning" || kind === "frost" || kind === "resto" || kind === "bow" || kind === "twohand";
}

function blankPiece(slot: SlotId): Piece {
  const kind = slotKind(slot);
  if (kind === "armor") {
    return { setId: "julianos", traitId: "divines", enchantId: "armor-mag", weight: "light" };
  }
  if (kind === "jewelry") {
    return { setId: "mothers-sorrow", traitId: "bloodthirsty", enchantId: "jewel-sd" };
  }
  const off = slot === "frontOff" || slot === "backOff";
  return {
    setId: off ? "none" : "mothers-sorrow",
    traitId: "precise",
    enchantId: "wep-berserker",
    weaponKind: off ? undefined : "inferno",
  };
}

export function emptyLoadout(): Loadout {
  const o = {} as Loadout;
  for (const slot of [...ARMOR_SLOTS, ...JEWEL_SLOTS, ...WEAPON_SLOTS]) {
    o[slot] = blankPiece(slot);
  }
  o.frontOff = { setId: "none", traitId: "precise", enchantId: "wep-berserker" };
  o.backOff = { setId: "none", traitId: "precise", enchantId: "wep-berserker" };
  return o;
}

export function pieceFor(
  setId: string,
  slot: SlotId,
  extras: Partial<Piece> = {},
): Piece {
  const base = blankPiece(slot);
  return { ...base, setId, ...extras };
}

export function presetLoadout(kind: "mag-dps" | "stam-dps" | "healer" | "tank" | "regen"): Loadout {
  const L = emptyLoadout();
  const body: SlotId[] = ["chest", "hands", "waist", "legs", "feet"];
  const putArmor = (slots: SlotId[], setId: string, weight: ArmorWeight, trait: string, ench: string) => {
    for (const s of slots) L[s] = pieceFor(setId, s, { weight, traitId: trait, enchantId: ench });
  };
  const putJewels = (setId: string, trait: string, ench: string) => {
    for (const s of JEWEL_SLOTS) L[s] = pieceFor(setId, s, { traitId: trait, enchantId: ench });
  };
  const staff = (slot: SlotId, setId: string, wk: WeaponKind, trait: string, ench: string) => {
    L[slot] = pieceFor(setId, slot, { weaponKind: wk, traitId: trait, enchantId: ench });
  };

  if (kind === "mag-dps") {
    putArmor(body, "julianos", "light", "divines", "armor-mag");
    L.head = pieceFor("slimecraw", "head", { weight: "light", traitId: "divines", enchantId: "armor-mag" });
    L.shoulders = pieceFor("slimecraw", "shoulders", { weight: "light", traitId: "divines", enchantId: "armor-mag" });
    putJewels("mothers-sorrow", "bloodthirsty", "jewel-sd");
    staff("frontMain", "mothers-sorrow", "inferno", "precise", "wep-berserker");
    staff("backMain", "mothers-sorrow", "lightning", "infused-weapon", "wep-shock");
    L.frontOff = { setId: "none", traitId: "precise", enchantId: "wep-berserker" };
    L.backOff = { setId: "none", traitId: "precise", enchantId: "wep-berserker" };
  } else if (kind === "stam-dps") {
    putArmor(body, "hunding", "medium", "divines", "armor-stam");
    L.head = pieceFor("kragh", "head", { weight: "medium", traitId: "divines", enchantId: "armor-stam" });
    L.shoulders = pieceFor("kragh", "shoulders", { weight: "medium", traitId: "divines", enchantId: "armor-stam" });
    putJewels("relequen", "bloodthirsty", "jewel-wd");
    staff("frontMain", "relequen", "bow", "precise", "wep-poison");
    staff("backMain", "relequen", "bow", "infused-weapon", "wep-poison");
  } else if (kind === "healer") {
    putArmor(body, "kagrenacs-hope", "light", "divines", "armor-mag");
    L.head = pieceFor("earthgore", "head", { weight: "light", traitId: "divines", enchantId: "armor-mag" });
    L.shoulders = pieceFor("earthgore", "shoulders", { weight: "light", traitId: "divines", enchantId: "armor-mag" });
    putJewels("spell-power-cure", "arcane", "jewel-magrec");
    staff("frontMain", "spell-power-cure", "resto", "infused-weapon", "wep-absorb-mag");
    staff("backMain", "spell-power-cure", "lightning", "infused-weapon", "wep-shock");
  } else if (kind === "tank") {
    putArmor(body, "fortified-brass", "heavy", "reinforced", "armor-hp");
    L.head = pieceFor("bloodspawn", "head", { weight: "heavy", traitId: "reinforced", enchantId: "armor-hp" });
    L.shoulders = pieceFor("bloodspawn", "shoulders", { weight: "heavy", traitId: "reinforced", enchantId: "armor-hp" });
    putJewels("turning-tide", "protective", "jewel-hp");
    staff("frontMain", "turning-tide", "onehand", "defending", "wep-crushe");
    L.frontOff = pieceFor("turning-tide", "frontOff", {
      weaponKind: "shield",
      traitId: "infused-weapon",
      enchantId: "shield-hp",
    });
    staff("backMain", "fortified-brass", "frost", "infused-weapon", "wep-crushe");
  } else {
    putArmor(body, "willows-path", "light", "infused-armor", "armor-prism");
    L.head = pieceFor("engine-guardian", "head", { weight: "light", traitId: "infused-armor", enchantId: "armor-hp" });
    L.shoulders = pieceFor("engine-guardian", "shoulders", {
      weight: "light",
      traitId: "infused-armor",
      enchantId: "armor-hp",
    });
    putJewels("wretched-vitality", "infused-jewel", "jewel-hprec");
    L.neck = pieceFor("wretched-vitality", "neck", { traitId: "infused-jewel", enchantId: "jewel-magrec" });
    L.ring1 = pieceFor("wretched-vitality", "ring1", { traitId: "infused-jewel", enchantId: "jewel-stamrec" });
    L.ring2 = pieceFor("oakensoul", "ring2", { traitId: "healthy", enchantId: "jewel-hprec" });
    staff("frontMain", "willows-path", "resto", "infused-weapon", "wep-absorb-hp");
    staff("backMain", "willows-path", "frost", "infused-weapon", "wep-absorb-mag");
  }
  return L;
}

export type LoadoutBreakdown = {
  mods: Required<StatMods>;
  mundusFactor: number;
  setCounts: { set: SetDef; count: number }[];
  weights: Record<ArmorWeight, number>;
  warnings: string[];
};

const ARMOR_RESIST: Record<ArmorWeight, number> = { light: 920, medium: 1060, heavy: 1480 };

export function evaluateLoadout(loadout: Loadout): LoadoutBreakdown {
  const mods = emptyMods();
  const counts = new Map<string, number>();
  const weights: Record<ArmorWeight, number> = { light: 0, medium: 0, heavy: 0 };
  const warnings: string[] = [];
  let mundusFactor = 1;
  let mythics = 0;

  const skipOff = (slot: SlotId) => {
    const main = slot === "frontOff" ? loadout.frontMain : slot === "backOff" ? loadout.backMain : undefined;
    if (!main) return false;
    return isTwoHanded(main.weaponKind);
  };

  for (const slot of [...ARMOR_SLOTS, ...JEWEL_SLOTS, ...WEAPON_SLOTS]) {
    if (skipOff(slot)) continue;
    const piece = loadout[slot];
    if (!piece || piece.setId === "none") {
      if (slotKind(slot) === "weapon" && (slot === "frontMain" || slot === "backMain")) {
        warnings.push(`Пустое оружие: ${SLOT_LABEL[slot]}`);
      }
      continue;
    }
    const setDef = sets.find((s) => s.id === piece.setId);
    if (setDef && setDef.id !== "none") {
      counts.set(setDef.id, (counts.get(setDef.id) ?? 0) + 1);
      if (setDef.source === "mythic") mythics += 1;
    }
    const trait = traits.find((t) => t.id === piece.traitId);
    const enchant = enchants.find((e) => e.id === piece.enchantId);
    const size = SLOT_SIZE[slot];
    const enchantMul = 1 + (trait?.enchantBonus ?? 0);

    if (slotKind(slot) === "armor") {
      const w = piece.weight ?? "light";
      weights[w] += 1;
      const resist = ARMOR_RESIST[w] * size;
      mods.physicalResist += resist;
      mods.spellResist += resist;
    }
    if (slotKind(slot) === "weapon") {
      const wk = piece.weaponKind;
      if (wk === "shield") {
        mods.physicalResist += 1800;
        mods.spellResist += 1800;
        mods.health += 800 * size;
      } else if (wk) {
        const dmg = isTwoHanded(wk) ? 1376 : 1032;
        mods.spellDamage += dmg * (slot.includes("Off") ? 0.5 : 1);
        mods.weaponDamage += dmg * (slot.includes("Off") ? 0.5 : 1);
      }
    }

    if (trait) addMods(mods, scaleMods(trait.mods, size));
    if (trait?.mundusBonus) mundusFactor += trait.mundusBonus;
    if (enchant) addMods(mods, scaleMods(enchant.mods, size * enchantMul));
  }

  if (mythics > 1) warnings.push("Надето больше одного мифика — в игре работает только один.");

  const setCounts: { set: SetDef; count: number }[] = [];
  for (const [id, count] of counts) {
    const setDef = sets.find((s) => s.id === id);
    if (!setDef) continue;
    const n = Math.min(count, setDef.maxPieces);
    setCounts.push({ set: setDef, count: n });
    for (let p = 1; p <= n; p++) {
      addMods(mods, setDef.bonuses[p as 1 | 2 | 3 | 4 | 5]);
    }
  }

  if (weights.light >= 5) {
    addMods(mods, { critChance: 0.1, magickaRecovery: 200, magickaPct: 0.02 });
  }
  if (weights.medium >= 5) {
    addMods(mods, { critChance: 0.1, staminaRecovery: 200, weaponDamagePct: 0.07 });
  }
  if (weights.heavy >= 5) {
    addMods(mods, { healthPct: 0.02, healthRecovery: 180, physicalResist: 2000, spellResist: 2000 });
  }

  return { mods, mundusFactor, setCounts, weights, warnings };
}
