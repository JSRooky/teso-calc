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
  type GearMix,
  type Loadout,
  type SlotId,
  type WeaponKind,
} from "./engine/gear";
import type { ArmorWeight } from "./engine/types";

const MIX_LABEL: { id: GearMix; title: string; hint: string }[] = [
  { id: "craft", title: "Только крафт", hint: "Два крафтовых 5pc, без данжей и триалов." },
  { id: "drop", title: "Только дроп", hint: "Оверленд, данж, триал, монстр, мифик." },
  { id: "mixed", title: "Дроп и крафт", hint: "Крафт на теле, дроп на бижутерии и оружии." },
];

function setsFor(filter: GearMix, currentId: string) {
  return sets.filter((s) => {
    if (s.id === "none" || s.id === currentId) return true;
    if (filter === "craft") return isCrafted(s.source);
    if (filter === "drop") return !isCrafted(s.source);
    return true;
  });
}

export function GearPanel({
  loadout,
  mix,
  onChange,
  onMix,
}: {
  loadout: Loadout;
  mix: GearMix;
  onChange: (next: Loadout) => void;
  onMix: (mix: GearMix) => void;
}) {
  const breakdown = evaluateLoadout(loadout);

  function patch(slot: SlotId, piece: Partial<Loadout[SlotId]>) {
    onChange({ ...loadout, [slot]: { ...loadout[slot], ...piece } });
  }

  return (
    <section className="panel">
      <h2>Экипировка · сеты, оружие, зачарования</h2>
      <div className="mix-toggle" role="tablist" aria-label="Источник сетов">
        {MIX_LABEL.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mix === m.id}
            className={mix === m.id ? "mix on" : "mix"}
            onClick={() => onMix(m.id)}
          >
            <strong>{m.title}</strong>
            <span>{m.hint}</span>
          </button>
        ))}
      </div>
      <p className="hint">
        Переключатель ставит готовую раскладку под текущую цель. Слоты ниже можно править вручную.
        Оружие на обоих барах даёт и сеты, и силу.
      </p>
      <div className="preset-row">
        {(
          [
            ["mag-dps", "Маг-DPS"],
            ["stam-dps", "Стам-DPS"],
            ["healer", "Хилер"],
            ["tank", "Танк"],
            ["regen", "Реген"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className="ghost" onClick={() => onChange(presetLoadout(id, mix))}>
            {label}
          </button>
        ))}
      </div>
      <SlotTable title="Броня" slots={ARMOR_SLOTS} loadout={loadout} patch={patch} armor mix={mix} />
      <SlotTable title="Бижутерия" slots={JEWEL_SLOTS} loadout={loadout} patch={patch} mix={mix} />
      <SlotTable title="Оружие (фронт и бэк)" slots={WEAPON_SLOTS} loadout={loadout} patch={patch} weapon mix={mix} />
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
  mix,
}: {
  title: string;
  slots: SlotId[];
  loadout: Loadout;
  patch: (slot: SlotId, piece: Partial<Loadout[SlotId]>) => void;
  armor?: boolean;
  weapon?: boolean;
  mix: GearMix;
}) {
  return (
    <div className="slot-block">
      <h3>{title}</h3>
      {slots.map((slot) => {
        const piece = loadout[slot];
        const kind = slotKind(slot);
        const main = slot === "frontOff" ? loadout.frontMain : slot === "backOff" ? loadout.backMain : undefined;
        const locked = Boolean(main && isTwoHanded(main.weaponKind));
        const opts = setsFor(mix, piece.setId).filter((s) => {
          if (s.source === "monster" && slotKind(slot) !== "armor") return false;
          return true;
        });
        const traitOpts = traits.filter((t) => t.slots === kind || t.slots === "any");
        const enchOpts = enchants.filter((e) => e.slots === kind || e.slots === "any");
        const craftOpts = opts.filter((s) => s.id === "none" || isCrafted(s.source));
        const dropOpts = opts.filter((s) => s.id !== "none" && !isCrafted(s.source));
        return (
          <div key={slot} className={locked ? "slot-row dim" : "slot-row"}>
            <div className="slot-name">{SLOT_LABEL[slot]}</div>
            {locked ? (
              <p className="hint">Двуручное / посох / лук занимает обе руки</p>
            ) : (
              <>
                <select value={piece.setId} onChange={(e) => patch(slot, { setId: e.target.value })}>
                  {mix === "mixed" ? (
                    <>
                      <optgroup label="Крафт">
                        {craftOpts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Дроп">
                        {dropOpts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.where}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    opts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id === "none" ? s.name : mix === "drop" ? `${s.name} — ${s.where}` : s.name}
                      </option>
                    ))
                  )}
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
