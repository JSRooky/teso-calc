import {
  ARMOR_SLOTS,
  JEWEL_SLOTS,
  SET_SOURCE_LABEL,
  SLOT_LABEL,
  WEAPON_KIND_LABEL,
  WEAPON_SLOTS,
  enchants,
  evaluateLoadout,
  isCrafted,
  isTwoHanded,
  presetLoadout,
  sets,
  slotKind,
  traits,
  type Loadout,
  type SlotId,
  type WeaponKind,
} from "./engine/gear";
import type { ArmorWeight } from "./engine/types";

type Filter = "all" | "craft" | "drop";

function setsFor(filter: Filter, slot: SlotId) {
  return sets.filter((s) => {
    if (s.id === "none") return true;
    if (filter === "craft" && !isCrafted(s.source)) return false;
    if (filter === "drop" && isCrafted(s.source)) return false;
    if (s.source === "monster" && slotKind(slot) !== "armor") return false;
    return true;
  });
}

export function GearPanel({
  loadout,
  onChange,
}: {
  loadout: Loadout;
  onChange: (next: Loadout) => void;
}) {
  const breakdown = evaluateLoadout(loadout);

  function patch(slot: SlotId, piece: Partial<Loadout[SlotId]>) {
    onChange({ ...loadout, [slot]: { ...loadout[slot], ...piece } });
  }

  return (
    <section className="panel">
      <h2>Экипировка · сеты, оружие, зачарования</h2>
      <p className="hint">
        Крафт собирается в любом весе и с вашими глифами. Дроп (оверленд, данж, триал, арена, монстр,
        мифик, ПвП) только выбивается — но слоты те же. Оружие на обоих барах даёт и сеты, и силу.
      </p>
      <div className="preset-row">
        {(
          [
            ["mag-dps", "Пресет маг-DPS (крафт Julianos + дроп Mother’s Sorrow)"],
            ["stam-dps", "Пресет стам-DPS (крафт Hunding + триал Relequen)"],
            ["healer", "Пресет хилер (крафт Kagrenac + данж SPC)"],
            ["tank", "Пресет танк (крафт Brass + данж Turning Tide)"],
            ["regen", "Пресет реген (крафт Ива + мифик Oakensoul)"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className="ghost" onClick={() => onChange(presetLoadout(id))}>
            {label}
          </button>
        ))}
      </div>
      <SlotTable title="Броня" slots={ARMOR_SLOTS} loadout={loadout} patch={patch} armor />
      <SlotTable title="Бижутерия" slots={JEWEL_SLOTS} loadout={loadout} patch={patch} />
      <SlotTable title="Оружие (фронт и бэк)" slots={WEAPON_SLOTS} loadout={loadout} patch={patch} weapon />
      <div className="set-summary">
        {breakdown.setCounts.map(({ set, count }) => (
          <span key={set.id} className={isCrafted(set.source) ? "tag craft" : "tag drop"}>
            {set.name} {count}/{set.maxPieces} · {SET_SOURCE_LABEL[set.source]}
          </span>
        ))}
      </div>
      <p className="hint">
        Вес: светлая {breakdown.weights.light} · средняя {breakdown.weights.medium} · тяжёлая{" "}
        {breakdown.weights.heavy}. Divines усиливают Мундус ×{breakdown.mundusFactor.toFixed(2)}.
      </p>
      {breakdown.warnings.map((w) => (
        <p key={w} className="hint warn">
          {w}
        </p>
      ))}
    </section>
  );
}

function SlotTable({
  title,
  slots,
  loadout,
  patch,
  armor,
  weapon,
}: {
  title: string;
  slots: SlotId[];
  loadout: Loadout;
  patch: (slot: SlotId, piece: Partial<Loadout[SlotId]>) => void;
  armor?: boolean;
  weapon?: boolean;
}) {
  return (
    <div className="slot-block">
      <h3>{title}</h3>
      {slots.map((slot) => {
        const piece = loadout[slot];
        const kind = slotKind(slot);
        const main = slot === "frontOff" ? loadout.frontMain : slot === "backOff" ? loadout.backMain : undefined;
        const locked = Boolean(main && isTwoHanded(main.weaponKind));
        const filterSets = (f: Filter) => setsFor(f, slot);
        const traitOpts = traits.filter((t) => t.slots === kind || t.slots === "any");
        const enchOpts = enchants.filter((e) => e.slots === kind || e.slots === "any");
        return (
          <div key={slot} className={locked ? "slot-row dim" : "slot-row"}>
            <div className="slot-name">{SLOT_LABEL[slot]}</div>
            {locked ? (
              <p className="hint">Двуручное / посох / лук занимает обе руки</p>
            ) : (
              <>
                <select value={piece.setId} onChange={(e) => patch(slot, { setId: e.target.value })}>
                  <optgroup label="Крафт">
                    {filterSets("craft").map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Только дроп">
                    {filterSets("drop").map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.where}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <select value={piece.traitId} onChange={(e) => patch(slot, { traitId: e.target.value })}>
                  {traitOpts.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select value={piece.enchantId} onChange={(e) => patch(slot, { enchantId: e.target.value })}>
                  {enchOpts.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                {armor && (
                  <select
                    value={piece.weight ?? "light"}
                    onChange={(e) => patch(slot, { weight: e.target.value as ArmorWeight })}
                  >
                    <option value="light">Светлая</option>
                    <option value="medium">Средняя</option>
                    <option value="heavy">Тяжёлая</option>
                  </select>
                )}
                {weapon && (
                  <select
                    value={piece.weaponKind ?? "inferno"}
                    onChange={(e) => patch(slot, { weaponKind: e.target.value as WeaponKind })}
                  >
                    {Object.entries(WEAPON_KIND_LABEL).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
