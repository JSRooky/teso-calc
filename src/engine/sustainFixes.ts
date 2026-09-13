import { foods } from "./catalog";
import { compute, type BuildInput } from "./compute";
import { goals } from "./goals";
import {
  ARMOR_SLOTS,
  JEWEL_SLOTS,
  SET_SOURCE_LABEL,
  evaluateLoadout,
  sets,
  type Loadout,
} from "./gear";
import { computeSustain, type SustainResult } from "./sustain";

export type FixAction =
  | { type: "food"; id: string }
  | { type: "mundus"; id: string }
  | { type: "potion"; id: string }
  | { type: "buff"; key: "majorIntellect" | "majorEndurance" }
  | { type: "jewelry-enchant"; enchantId: string; count: 1 | 2 | 3 }
  | { type: "weapon-enchant"; enchantId: string }
  | { type: "set-body"; setId: string }
  | { type: "set-monster"; setId: string };

export type BalancePreview = {
  magickaNet: number;
  staminaNet: number;
  damageDeltaPct: number;
  score: number;
  label: string;
  closes: boolean;
};

export type SustainFix = {
  id: string;
  pool: "magicka" | "stamina";
  category: "set" | "food" | "mundus" | "enchant" | "potion" | "buff";
  tier: "max" | "near";
  title: string;
  detail: string;
  gain: string;
  already: boolean;
  action?: FixAction;
  preview?: BalancePreview;
};

function recFromSet(setId: string) {
  const def = sets.find((s) => s.id === setId);
  if (!def) return { mag: 0, stam: 0 };
  let mag = 0;
  let stam = 0;
  for (let p = 1; p <= def.maxPieces; p++) {
    const b = def.bonuses[p as 1 | 2 | 3 | 4 | 5];
    mag += b?.magickaRecovery ?? 0;
    stam += b?.staminaRecovery ?? 0;
  }
  return { mag, stam };
}

export function applySustainFix(build: BuildInput, action: FixAction): Partial<BuildInput> {
  if (action.type === "food") return { foodId: action.id };
  if (action.type === "mundus") return { mundusId: action.id };
  if (action.type === "buff") return { [action.key]: true };
  if (action.type === "set-body") {
    const loadout: Loadout = { ...build.loadout };
    for (const slot of ["chest", "hands", "waist", "legs", "feet"] as const) {
      loadout[slot] = { ...loadout[slot], setId: action.setId };
    }
    return { loadout };
  }
  if (action.type === "set-monster") {
    const loadout: Loadout = { ...build.loadout };
    loadout.head = { ...loadout.head, setId: action.setId };
    loadout.shoulders = { ...loadout.shoulders, setId: action.setId };
    return { loadout };
  }
  if (action.type === "jewelry-enchant") {
    const loadout: Loadout = { ...build.loadout };
    const n = action.count;
    JEWEL_SLOTS.forEach((slot, i) => {
      if (i < n) loadout[slot] = { ...loadout[slot], enchantId: action.enchantId };
    });
    return { loadout };
  }
  if (action.type === "weapon-enchant") {
    const loadout: Loadout = { ...build.loadout };
    loadout.frontMain = { ...loadout.frontMain, enchantId: action.enchantId };
    return { loadout };
  }
  return {};
}

function power(stats: { spellDamage: number; weaponDamage: number; critChance: number; critDamage: number }) {
  return Math.max(stats.spellDamage, stats.weaponDamage) * (1 + stats.critChance * stats.critDamage);
}

export function previewFix(
  build: BuildInput,
  before: SustainResult,
  potionId: string,
  potionCooldown: number,
  action: FixAction,
): BalancePreview {
  const patch = applySustainFix(build, action);
  const nextBuild = { ...build, ...patch };
  const nextPotion = action.type === "potion" ? action.id : potionId;
  const after = compute(nextBuild);
  const sus = computeSustain(nextBuild, after.stats, nextPotion, potionCooldown);
  const now = compute(build);
  const dmgKeep = power(after.stats) / Math.max(1, power(now.stats));
  const damageDeltaPct = (dmgKeep - 1) * 100;

  const magWas = before.magickaNet < 0;
  const stamWas = before.staminaNet < 0;
  const magOk = sus.magickaNet >= 0;
  const stamOk = sus.staminaNet >= 0;
  const closes = (magWas ? magOk : true) && (stamWas ? stamOk : true);

  const susMag = magWas ? (magOk ? 1 : Math.max(0, 1 + sus.magickaNet / Math.max(1, before.magickaSpend))) : 1;
  const susStam = stamWas ? (stamOk ? 1 : Math.max(0, 1 + sus.staminaNet / Math.max(1, before.staminaSpend))) : 1;
  const susH = Math.min(1, (susMag + susStam) / (Number(magWas) + Number(stamWas) || 1));

  const goal = goals.find((g) => g.id === build.goalId) ?? goals[0];
  const wDmg = Math.max(0.15, goal.weights.damage);
  const wSus = Math.max(0.2, goal.weights.resourceRegen + 0.25);
  const score = Math.round(100 * (wDmg * Math.min(1.05, dmgKeep) + wSus * susH) / (wDmg + wSus));

  let label = "Компромисс";
  if (closes && score >= 78) label = "Хорошо держит цель";
  else if (closes && score >= 62) label = "Закрывает голод, урон чуть падает";
  else if (closes) label = "Сустейн ценой урона";
  else if (score >= 70) label = "Ближе к плюсу, голод не закрыт";
  else label = "Слабо закрывает расход";

  return {
    magickaNet: sus.magickaNet,
    staminaNet: sus.staminaNet,
    damageDeltaPct,
    score: Math.max(0, Math.min(100, score)),
    label,
    closes,
  };
}

export function suggestSustainFixes(
  build: BuildInput,
  sustain: SustainResult,
  potionId: string,
  potionCooldown: number,
): SustainFix[] {
  const tips: SustainFix[] = [];
  const worn = new Set(evaluateLoadout(build.loadout).setCounts.map((s) => s.set.id));
  const light = ARMOR_SLOTS.filter((s) => build.loadout[s].weight === "light").length;
  const medium = ARMOR_SLOTS.filter((s) => build.loadout[s].weight === "medium").length;
  const jewelEnch = JEWEL_SLOTS.map((s) => build.loadout[s].enchantId);
  const recCount = (id: string) => jewelEnch.filter((e) => e === id).length;

  const needMag = sustain.magickaNet < 0;
  const needStam = sustain.staminaNet < 0;
  if (!needMag && !needStam) return [];

  const pushSet = (setId: string, pool: "magicka" | "stamina", tier: "max" | "near") => {
    const def = sets.find((s) => s.id === setId);
    if (!def) return;
    const rec = recFromSet(setId);
    const gainN = pool === "magicka" ? rec.mag : rec.stam;
    const extra =
      setId === "willows-path"
        ? "+16% ко всем регенам (5pc)"
        : setId === "oakensoul"
          ? "+10% регена (мифик, один бар)"
          : setId === "julianos" || setId === "hunding"
            ? "урон, не реген — для сравнения баланса"
            : `+${gainN} регена (до ${def.maxPieces}pc)`;
    tips.push({
      id: `set-${setId}-${pool}`,
      pool,
      category: "set",
      tier,
      title: `${def.name} · ${SET_SOURCE_LABEL[def.source]}`,
      detail: `${def.note} ${def.where}.`,
      gain: extra,
      already: worn.has(setId),
      action:
        def.source === "monster"
          ? { type: "set-monster", setId }
          : def.source === "mythic"
            ? undefined
            : { type: "set-body", setId },
    });
  };

  if (needMag) {
    if (!build.majorIntellect) {
      tips.push({
        id: "buff-int",
        pool: "magicka",
        category: "buff",
        tier: "near",
        title: "Major Intellect",
        detail: "Бафф с банки. Почти без потери урона, если банку и так пьёте.",
        gain: "+30% регена магии",
        already: false,
        action: { type: "buff", key: "majorIntellect" },
      });
    }
    tips.push({
      id: "pot-mag",
      pool: "magicka",
      category: "potion",
      tier: "max",
      title: "Эссенция магии",
      detail: "Максимум возврата магии за прок.",
      gain: "+7584 магии / 45 с",
      already: potionId === "essence-mag" || potionId === "spell-power",
      action: { type: "potion", id: "essence-mag" },
    });
    tips.push({
      id: "pot-spell",
      pool: "magicka",
      category: "potion",
      tier: "near",
      title: "Эссенция силы заклинаний",
      detail: "Тот же возврат магии плюс Major Sorcery. Чуть универсальнее чистой эссенции.",
      gain: "+7584 магии / 45 с и бафф урона",
      already: potionId === "spell-power",
      action: { type: "potion", id: "spell-power" },
    });
    tips.push({
      id: "pot-tri-mag",
      pool: "magicka",
      category: "potion",
      tier: "near",
      title: "Тройная эссенция",
      detail: "Меньше магии, зато подпитывает стамину и ХП. Ближе к балансу соло.",
      gain: "+2392 магии и стамины / 45 с",
      already: potionId === "tri",
      action: { type: "potion", id: "tri" },
    });

    for (const [fid, tier] of [
      ["ghastly-eye-bowl", "max"],
      ["witchmothers-potent", "near"],
      ["dubious-camoran", "near"],
    ] as const) {
      const f = foods.find((x) => x.id === fid)!;
      tips.push({
        id: `food-${fid}`,
        pool: "magicka",
        category: "food",
        tier,
        title: f.name,
        detail: f.note,
        gain:
          fid === "ghastly-eye-bowl"
            ? "+459 регена магии"
            : fid === "witchmothers-potent"
              ? "+394 регена магии, больше ХП"
              : "+493 обоих регенов, меньше пула магии",
        already: build.foodId === fid,
        action: { type: "food", id: fid },
      });
    }

    tips.push({
      id: "mundus-atr",
      pool: "magicka",
      category: "mundus",
      tier: "max",
      title: "Мундус: Атронах",
      detail: "Максимум регена магии с камня. Divines усиливают.",
      gain: "+238 регена магии",
      already: build.mundusId === "atronach",
      action: { type: "mundus", id: "atronach" },
    });
    tips.push({
      id: "mundus-mage",
      pool: "magicka",
      category: "mundus",
      tier: "near",
      title: "Мундус: Маг (не реген)",
      detail: "Урон, не сустейн. Для сравнения: если камень не трогать, баланс цели max-DPS выше.",
      gain: "+238 силы заклинаний, 0 регена",
      already: build.mundusId === "mage",
      action: { type: "mundus", id: "mage" },
    });

    tips.push({
      id: "ench-j-mag-3",
      pool: "magicka",
      category: "enchant",
      tier: "max",
      title: "Реген магии на 3 слота бижу",
      detail: "Максимум глифов. Сильно бьёт по силе заклинаний.",
      gain: "+169 × 3 регена",
      already: recCount("jewel-magrec") >= 3,
      action: { type: "jewelry-enchant", enchantId: "jewel-magrec", count: 3 },
    });
    tips.push({
      id: "ench-j-mag-2",
      pool: "magicka",
      category: "enchant",
      tier: "near",
      title: "Реген магии на шею + 1 кольцо",
      detail: "Одно кольцо оставляете на силу. Ближе к парсу.",
      gain: "+169 × 2 регена",
      already: recCount("jewel-magrec") === 2,
      action: { type: "jewelry-enchant", enchantId: "jewel-magrec", count: 2 },
    });
    tips.push({
      id: "ench-j-mag-1",
      pool: "magicka",
      category: "enchant",
      tier: "near",
      title: "Реген магии только на шею",
      detail: "Минимальная правка. Часто хватает вместе с едой.",
      gain: "+169 регена",
      already: recCount("jewel-magrec") === 1,
      action: { type: "jewelry-enchant", enchantId: "jewel-magrec", count: 1 },
    });
    tips.push({
      id: "ench-w-mag",
      pool: "magicka",
      category: "enchant",
      tier: "near",
      title: "Поглощение магии на фронт-оружии",
      detail: "Один слот, бэкбар можно оставить на урон/статус.",
      gain: "прок поглощения",
      already: build.loadout.frontMain.enchantId === "wep-absorb-mag",
      action: { type: "weapon-enchant", enchantId: "wep-absorb-mag" },
    });

    pushSet("wretched-vitality", "magicka", "max");
    pushSet("willows-path", "magicka", "max");
    pushSet("kagrenacs-hope", "magicka", "near");
    pushSet("shacklebreaker", "magicka", "near");
    pushSet("engine-guardian", "magicka", "near");
    pushSet("jorvuld", "magicka", "near");
    pushSet("spell-power-cure", "magicka", "near");
    pushSet("slimecraw", "magicka", "near");
    pushSet("oakensoul", "magicka", "max");
    if (light < 5) {
      tips.push({
        id: "armor-light",
        pool: "magicka",
        category: "set",
        tier: "near",
        title: "5+ частей светлой брони",
        detail: `Сейчас светлой ${light}. Реген магии без смены сета.`,
        gain: "+200 регена магии",
        already: false,
      });
    }
  }

  if (needStam) {
    if (!build.majorEndurance) {
      tips.push({
        id: "buff-end",
        pool: "stamina",
        category: "buff",
        tier: "near",
        title: "Major Endurance",
        detail: "Бафф с банки, почти без потери WD.",
        gain: "+30% регена стамины",
        already: false,
        action: { type: "buff", key: "majorEndurance" },
      });
    }
    tips.push({
      id: "pot-stam",
      pool: "stamina",
      category: "potion",
      tier: "max",
      title: "Эссенция запаса сил",
      detail: "Максимум возврата стамины.",
      gain: "+7584 стамины / 45 с",
      already: potionId === "essence-stam" || potionId === "weapon-power",
      action: { type: "potion", id: "essence-stam" },
    });
    tips.push({
      id: "pot-wd",
      pool: "stamina",
      category: "potion",
      tier: "near",
      title: "Эссенция силы оружия",
      detail: "Возврат стамины плюс Major Brutality.",
      gain: "+7584 стамины / 45 с и бафф урона",
      already: potionId === "weapon-power",
      action: { type: "potion", id: "weapon-power" },
    });
    tips.push({
      id: "pot-tri-stam",
      pool: "stamina",
      category: "potion",
      tier: "near",
      title: "Тройная эссенция",
      detail: "Меньше стамины, зато оба пула.",
      gain: "+2392 / 45 с обоим",
      already: potionId === "tri",
      action: { type: "potion", id: "tri" },
    });
    for (const [fid, tier] of [
      ["lava-foot-soup", "max"],
      ["dubious-camoran", "near"],
      ["bewitched-sugar-skulls", "near"],
    ] as const) {
      const f = foods.find((x) => x.id === fid)!;
      tips.push({
        id: `food-${fid}`,
        pool: "stamina",
        category: "food",
        tier,
        title: f.name,
        detail: f.note,
        gain:
          fid === "lava-foot-soup"
            ? "+459 регена стамины"
            : fid === "dubious-camoran"
              ? "+493 обоих регенов"
              : "+пулы, без регена — для сравнения",
        already: build.foodId === fid,
        action: { type: "food", id: fid },
      });
    }
    tips.push({
      id: "mundus-ser",
      pool: "stamina",
      category: "mundus",
      tier: "max",
      title: "Мундус: Змей",
      detail: "Максимум регена стамины с камня.",
      gain: "+238 регена стамины",
      already: build.mundusId === "serpent",
      action: { type: "mundus", id: "serpent" },
    });
    tips.push({
      id: "mundus-war",
      pool: "stamina",
      category: "mundus",
      tier: "near",
      title: "Мундус: Воин (не реген)",
      detail: "Для сравнения баланса урона, если камень не менять.",
      gain: "+238 силы оружия",
      already: build.mundusId === "warrior",
      action: { type: "mundus", id: "warrior" },
    });
    tips.push({
      id: "ench-j-stam-3",
      pool: "stamina",
      category: "enchant",
      tier: "max",
      title: "Реген стамины на 3 слота бижу",
      detail: "Максимум глифов, минус сила оружия.",
      gain: "+169 × 3",
      already: recCount("jewel-stamrec") >= 3,
      action: { type: "jewelry-enchant", enchantId: "jewel-stamrec", count: 3 },
    });
    tips.push({
      id: "ench-j-stam-2",
      pool: "stamina",
      category: "enchant",
      tier: "near",
      title: "Реген стамины на шею + 1 кольцо",
      detail: "Одно кольцо оставляете на WD.",
      gain: "+169 × 2",
      already: recCount("jewel-stamrec") === 2,
      action: { type: "jewelry-enchant", enchantId: "jewel-stamrec", count: 2 },
    });
    tips.push({
      id: "ench-j-stam-1",
      pool: "stamina",
      category: "enchant",
      tier: "near",
      title: "Реген стамины только на шею",
      detail: "Мягкий вариант.",
      gain: "+169 регена",
      already: recCount("jewel-stamrec") === 1,
      action: { type: "jewelry-enchant", enchantId: "jewel-stamrec", count: 1 },
    });
    tips.push({
      id: "ench-w-stam",
      pool: "stamina",
      category: "enchant",
      tier: "near",
      title: "Поглощение стамины на фронт-оружии",
      detail: "Один слот вместо трёх глифов.",
      gain: "прок поглощения",
      already: build.loadout.frontMain.enchantId === "wep-absorb-stam",
      action: { type: "weapon-enchant", enchantId: "wep-absorb-stam" },
    });
    pushSet("wretched-vitality", "stamina", "max");
    pushSet("willows-path", "stamina", "max");
    pushSet("heartland", "stamina", "near");
    pushSet("shacklebreaker", "stamina", "near");
    pushSet("engine-guardian", "stamina", "near");
    pushSet("bloodspawn", "stamina", "near");
    pushSet("oakensoul", "stamina", "max");
    if (medium < 5) {
      tips.push({
        id: "armor-med",
        pool: "stamina",
        category: "set",
        tier: "near",
        title: "5+ частей средней брони",
        detail: `Сейчас средней ${medium}.`,
        gain: "+200 регена стамины",
        already: false,
      });
    }
  }

  const uniq = new Map<string, SustainFix>();
  for (const t of tips) {
    if (!uniq.has(t.id)) uniq.set(t.id, t);
  }

  return [...uniq.values()]
    .map((t) => ({
      ...t,
      preview: t.action
        ? previewFix(build, sustain, potionId, potionCooldown, t.action)
        : undefined,
    }))
    .sort((a, b) => {
      if (a.already !== b.already) return Number(a.already) - Number(b.already);
      const as = a.preview?.score ?? 0;
      const bs = b.preview?.score ?? 0;
      return bs - as;
    });
}
