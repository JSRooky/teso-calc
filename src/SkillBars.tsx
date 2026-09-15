import { EsoIcon } from "./EsoIcon";
import { allSkills, skillLinesForClass, weaponSkillLines } from "./engine/catalog";
import { mirrorSlot, setBarSlot, type SkillBar } from "./engine/compute";
import type { SkillForecast } from "./engine/compute";
import { skillIconFile } from "./engine/icons";

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export function SkillBars({
  classId,
  frontBar,
  backBar,
  passiveIds,
  skillRanks,
  forecasts,
  onFront,
  onBack,
  onPassives,
  onRank,
}: {
  classId: string;
  frontBar: SkillBar;
  backBar: SkillBar;
  passiveIds: string[];
  skillRanks: Record<string, number>;
  forecasts: SkillForecast[];
  onFront: (bar: SkillBar) => void;
  onBack: (bar: SkillBar) => void;
  onPassives: (ids: string[]) => void;
  onRank: (id: string, rank: number) => void;
}) {
  const actives = [
    ...skillLinesForClass(classId),
    ...weaponSkillLines(),
  ].flatMap((l) => l.skills.filter((s) => s.kind === "active"));
  const ultimates = [
    ...skillLinesForClass(classId),
    ...weaponSkillLines(),
  ].flatMap((l) => l.skills.filter((s) => s.kind === "ultimate"));
  const passives = skillLinesForClass(classId).flatMap((l) => l.skills.filter((s) => s.kind === "passive"));

  function changeSlot(which: "front" | "back", index: number, id: string | null) {
    if (which === "front") {
      onFront(setBarSlot(frontBar, index, id));
      onBack(mirrorSlot(backBar, index, id));
    } else {
      onBack(setBarSlot(backBar, index, id));
      onFront(mirrorSlot(frontBar, index, id));
    }
  }

  function changeUlt(which: "front" | "back", id: string | null) {
    if (which === "front") {
      onFront({ ...frontBar, ultimate: id });
      if (id && backBar.ultimate === id) onBack({ ...backBar, ultimate: id });
    } else {
      onBack({ ...backBar, ultimate: id });
      if (id && frontBar.ultimate === id) onFront({ ...frontBar, ultimate: id });
    }
  }

  return (
    <section className="panel">
      <h2>Полный бар · фронт и бэк (5 + ульта)</h2>
      <div className="bars">
        <BarColumn
          title="Фронтбар"
          bar={frontBar}
          peer={backBar}
          actives={actives}
          ultimates={ultimates}
          forecasts={forecasts}
          onSlot={(i, id) => changeSlot("front", i, id)}
          onUlt={(id) => changeUlt("front", id)}
        />
        <BarColumn
          title="Бэкбар"
          bar={backBar}
          peer={frontBar}
          actives={actives}
          ultimates={ultimates}
          forecasts={forecasts}
          onSlot={(i, id) => changeSlot("back", i, id)}
          onUlt={(id) => changeUlt("back", id)}
        />
      </div>
      <h3>Пассивки класса</h3>
      <div className="checks">
        {passives.map((sk) => (
          <label key={sk.id} className="check">
            <input
              type="checkbox"
              checked={passiveIds.includes(sk.id)}
              onChange={() => {
                onPassives(
                  passiveIds.includes(sk.id)
                    ? passiveIds.filter((x) => x !== sk.id)
                    : [...passiveIds, sk.id],
                );
              }}
            />
            <EsoIcon file={skillIconFile(sk.id)} alt={sk.name} size={28} />
            {sk.name}
          </label>
        ))}
      </div>
      <h3>Ранги способностей на барах</h3>
      <div className="lines">
        {[...new Set([...frontBar.slots, frontBar.ultimate, ...backBar.slots, backBar.ultimate, ...passiveIds])]
          .filter((id): id is string => Boolean(id))
          .map((id) => {
            const sk = allSkills().find((s) => s.id === id);
            if (!sk) return null;
            const fc = forecasts.find((f) => f.skill.id === id);
            return (
              <div key={id} className="skill on skill-row">
                <EsoIcon file={skillIconFile(id)} alt={sk.name} size={40} />
                <div>
                  <strong>{sk.name}</strong>
                  <label className="rank">
                    Ранг {skillRanks[id] ?? sk.maxRank} / {sk.maxRank}
                    <input
                      type="range"
                      min={1}
                      max={sk.maxRank}
                      value={skillRanks[id] ?? sk.maxRank}
                      onChange={(e) => onRank(id, Number(e.target.value))}
                    />
                  </label>
                  {fc && (
                    <p className="hit">
                      {fc.isHeal ? "Хил" : "Урон"}: {fmt(fc.hit)}
                      {fc.onBar !== "passive" ? ` · ${fc.onBar === "both" ? "оба бара" : fc.onBar}` : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function BarColumn({
  title,
  bar,
  peer,
  actives,
  ultimates,
  forecasts,
  onSlot,
  onUlt,
}: {
  title: string;
  bar: SkillBar;
  peer: SkillBar;
  actives: ReturnType<typeof allSkills>;
  ultimates: ReturnType<typeof allSkills>;
  forecasts: SkillForecast[];
  onSlot: (index: number, id: string | null) => void;
  onUlt: (id: string | null) => void;
}) {
  return (
    <div>
      <h3>{title}</h3>
      <div className="bar-slots">
        {bar.slots.map((id, i) => {
          const linked = Boolean(id && peer.slots[i] === id);
          return (
            <label key={i} className={linked ? "bar-slot linked" : "bar-slot"}>
              <span className="slot-head">
                {id ? <EsoIcon file={skillIconFile(id)} alt="" size={36} /> : <span className="eso-icon empty" />}
                Слот {i + 1}
                {linked ? " · оба бара" : ""}
              </span>
              <select value={id ?? ""} onChange={(e) => onSlot(i, e.target.value || null)}>
                <option value="">— пусто —</option>
                {actives.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {id && forecasts.find((f) => f.skill.id === id) && (
                <em className="hit">{fmt(forecasts.find((f) => f.skill.id === id)!.hit)}</em>
              )}
            </label>
          );
        })}
        <label className={bar.ultimate && bar.ultimate === peer.ultimate ? "bar-slot linked" : "bar-slot"}>
          <span className="slot-head">
            {bar.ultimate ? (
              <EsoIcon file={skillIconFile(bar.ultimate)} alt="" size={36} />
            ) : (
              <span className="eso-icon empty" />
            )}
            Ульта
            {bar.ultimate && bar.ultimate === peer.ultimate ? " · оба бара" : ""}
          </span>
          <select value={bar.ultimate ?? ""} onChange={(e) => onUlt(e.target.value || null)}>
            <option value="">— пусто —</option>
            {ultimates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
