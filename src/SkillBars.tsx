import { allSkills, skillLinesForClass, weaponSkillLines } from "./engine/catalog";
import type { SkillBar } from "./engine/compute";
import type { SkillForecast } from "./engine/compute";

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

  return (
    <section className="panel">
      <h2>Полный бар · фронт и бэк (5 + ульта)</h2>
      <p className="hint">
        Как в игре: два бара по пять способностей и ульта. Оружейные скиллы доступны вместе с
        классовыми. Пассивки не занимают слот, но входят в статы.
      </p>
      <div className="bars">
        <BarColumn
          title="Фронтбар"
          bar={frontBar}
          actives={actives}
          ultimates={ultimates}
          forecasts={forecasts}
          onChange={onFront}
        />
        <BarColumn
          title="Бэкбар"
          bar={backBar}
          actives={actives}
          ultimates={ultimates}
          forecasts={forecasts}
          onChange={onBack}
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
              <div key={id} className="skill on">
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
            );
          })}
      </div>
    </section>
  );
}

function BarColumn({
  title,
  bar,
  actives,
  ultimates,
  forecasts,
  onChange,
}: {
  title: string;
  bar: SkillBar;
  actives: ReturnType<typeof allSkills>;
  ultimates: ReturnType<typeof allSkills>;
  forecasts: SkillForecast[];
  onChange: (bar: SkillBar) => void;
}) {
  return (
    <div>
      <h3>{title}</h3>
      <div className="bar-slots">
        {bar.slots.map((id, i) => (
          <label key={i}>
            Слот {i + 1}
            <select
              value={id ?? ""}
              onChange={(e) => {
                const slots = [...bar.slots] as SkillBar["slots"];
                slots[i] = e.target.value || null;
                onChange({ ...bar, slots });
              }}
            >
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
        ))}
        <label>
          Ульта
          <select
            value={bar.ultimate ?? ""}
            onChange={(e) => onChange({ ...bar, ultimate: e.target.value || null })}
          >
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
