/** Current ESOUI textures via GuildPlanner (AVIF dump, updated June 2026). */
export const ICON_CDN = "https://static.guildplanner.pro/eso-avif/esoui/art/icons";

export function iconUrl(file: string) {
  return `${ICON_CDN}/${file}.avif`;
}

/** Filenames from UESP skill browser / in-game ESOUI (update 42+ dump). */
export const SKILL_ICONS: Record<string, string> = {
  "lava-whip": "ability_dragonknight_001",
  eruption: "ability_dragonknight_016b",
  "flames-of-oblivion": "ability_dragonknight_002_a",
  "obsidian-shield": "ability_dragonknight_017",
  "igneous-shield": "ability_dragonknight_017b",
  "coagulating-blood": "ability_dragonknight_011_a",
  "helping-hands": "ability_sorcerer_007",
  "crystal-frags": "ability_sorcerer_thunderstomp",
  "bound-aegis": "ability_sorcerer_bound_aegis",
  "mystic-orb": "ability_undaunted_004_a",
  "power-surge": "ability_sorcerer_power_surge",
  "hardened-ward": "ability_sorcerer_typhoon",
  "surprise-attack": "ability_nightblade_002_a",
  "grim-focus": "ability_nightblade_005",
  hemorrhage: "passive_weapon_017",
  "refreshing-path": "ability_nightblade_010_a",
  "siphoning-attacks": "ability_nightblade_003_b",
  catalyst: "passive_sorcerer_046",
  "puncturing-sweep": "ability_templar_reckless_attacks",
  "vampire-sacrifice": "ability_templar_stendarr_aura",
  illuminate: "ability_templar_012",
  "breath-of-life": "ability_templar_breath_of_life",
  "sacred-ground": "ability_templar_014",
  "cutting-dive": "ability_warden_013_b",
  "advanced-species": "passive_warden_011",
  "soothing-spores": "ability_warden_008_a",
  maturation: "passive_warden_007",
  "fetcher-infection": "ability_warden_014_a",
  blastbones: "ability_necromancer_002",
  "bone-armor": "ability_necromancer_008",
  "render-flesh": "ability_necromancer_013",
  fatecarver: "ability_arcanist_002",
  "writhing-runeblades": "ability_arcanist_001_a",
  runeguard: "ability_arcanist_010",
  "reconstructive-domain": "ability_arcanist_017_b",
  "crushing-shock": "ability_destructionstaff_001a",
  "wall-of-elements": "ability_destructionstaff_002",
  "healing-springs": "ability_restorationstaff_004a",
  "combat-prayer": "ability_restorationstaff_003_b",
  "endless-hail": "ability_bow_003_a",
  "poison-injection": "ability_bow_002_b",
  stampede: "ability_2handed_003_a",
  "rapid-strikes": "ability_dualwield_002_b",
  "puncturing-remedy": "ability_1handed_002",
  "standard-of-might": "ability_dragonknight_006_b",
  "storm-atronach": "ability_sorcerer_storm_atronach",
  "soul-harvest": "ability_nightblade_007_b",
  "radial-sweep": "ability_templar_radial_sweep",
  "wild-guardian": "ability_warden_018_c",
  "glacial-colossus": "ability_necromancer_006_a",
  "tide-kings-gaze": "ability_arcanist_006_a",
};

export const META_ICONS = {
  attributes: "ability_warrior_018",
  magicka: "ability_mage_020",
  stamina: "ability_rogue_046",
  health: "ability_healer_002",
  craft: "crafting_enchantment_001",
  drop: "ability_armor_006",
  mundus: "ability_mundusstones_001",
  champion: "ability_mage_065",
  book: "quest_book_001",
  armor: "ability_armor_001",
} as const;

export function skillIconFile(skillId: string) {
  return SKILL_ICONS[skillId] ?? "ability_mage_065";
}
