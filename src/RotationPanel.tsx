import { EsoIcon } from "./EsoIcon";
import type { RotationResult } from "./engine/rotation";
import { skillIconFile } from "./engine/icons";

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU");
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

export function RotationPanel({ rot }: { rot: RotationResult }) {
  return (
    <section className="panel">
      <h2>Исходящий урон · ротация {rot.duration} с</h2>
      <dl className="stats sustain-stats">
        <div>
          <dt>DPS</dt>
          <dd>{fmt(rot.dps)}</dd>
        </div>
        <div>
          <dt>Сумма</dt>
          <dd>{fmt(rot.totalDamage)}</dd>
        </div>
        <div>
          <dt>Броня манекена</dt>
          <dd>×{rot.mitigation.toFixed(2)}</dd>
        </div>
      </dl>
      {rot.auras.length > 0 && (
        <p className="set-summary">
          {rot.auras.map((a) => (
            <span key={a.name} className="tag craft">
              {a.name} {pct(a.uptime)}
            </span>
          ))}
        </p>
      )}
      <table className="sustain-table">
        <thead>
          <tr>
            <th>Источник</th>
            <th>Урон</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {rot.sources.map((s) => (
            <tr key={s.id}>
              <td>
                <span className="skill-cell">
                  {s.id !== "light-attack" && <EsoIcon file={skillIconFile(s.id)} alt="" size={28} />}
                  {s.name}
                </span>
              </td>
              <td>{fmt(s.damage)}</td>
              <td>{s.pct.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
