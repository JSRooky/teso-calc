import { EsoIcon } from "./EsoIcon";
import type { BuildInput, DerivedStats } from "./engine/compute";
import { skillIconFile } from "./engine/icons";
import { computeSustain, potions } from "./engine/sustain";

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU");
}

function fmt1(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

const ROLE: Record<string, string> = {
  spam: "спам",
  channel: "канал",
  maintain: "поддержание",
  ultimate: "ульта (не мага/стам)",
};

export function SustainPanel({
  build,
  stats,
  potionId,
  potionCooldown,
  onPotion,
  onCooldown,
}: {
  build: BuildInput;
  stats: DerivedStats;
  potionId: string;
  potionCooldown: number;
  onPotion: (id: string) => void;
  onCooldown: (n: number) => void;
}) {
  const s = computeSustain(build, stats, potionId, potionCooldown);
  const potion = potions.find((p) => p.id === potionId) ?? potions[0];

  return (
    <section className="panel">
      <h2>Сустейн · расход магии и запаса сил</h2>
      <p className="hint">
        Стоимость — золото CP160 с UESP. Спам на фронте считается как основной (канал или самая
        дорогая способность раз в ~1.1 с); остальные спамы — реже, иначе три скилла не жмутся
        одновременно. Реген с листа: Recovery ÷ 2 (тик раз в 2 с). Банки по умолчанию 45 с.
      </p>
      <div className="sustain-controls">
        <label>
          Банка
          <select value={potionId} onChange={(e) => onPotion(e.target.value)}>
            {potions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Кулдаун банки · {potionCooldown} с
          <input
            type="range"
            min={30}
            max={60}
            step={1}
            value={potionCooldown}
            onChange={(e) => onCooldown(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="hint">{potion.note}</p>

      <table className="sustain-table">
        <thead>
          <tr>
            <th>Скилл</th>
            <th>Роль</th>
            <th>Стоимость</th>
            <th>Раз в</th>
            <th>Магия / с</th>
            <th>Стам / с</th>
          </tr>
        </thead>
        <tbody>
          {s.skills.map((row) => (
            <tr key={row.skill.id}>
              <td className="skill-cell">
                <EsoIcon file={skillIconFile(row.skill.id)} alt="" size={28} />
                {row.skill.name}
              </td>
              <td>{ROLE[row.role]}</td>
              <td>
                {row.role === "ultimate"
                  ? "ульта"
                  : row.magicka
                    ? `${fmt(row.magicka)} маг${row.role === "channel" ? "/с канала" : ""}`
                    : row.stamina
                      ? `${fmt(row.stamina)} стам`
                      : "—"}
              </td>
              <td>{row.role === "ultimate" ? "—" : `${fmt1(row.interval)} с`}</td>
              <td>{fmt1(row.magickaPerSec)}</td>
              <td>{fmt1(row.staminaPerSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="stats sustain-stats">
        <div>
          <dt>Расход магии</dt>
          <dd>{fmt1(s.magickaSpend)} / с</dd>
        </div>
        <div>
          <dt>Реген магии</dt>
          <dd>{fmt1(s.magickaRegen)} / с</dd>
        </div>
        <div>
          <dt>Банка → магия</dt>
          <dd>
            {fmt(potion.magicka)} / {potionCooldown} с = {fmt1(s.magickaPotion)} / с
          </dd>
        </div>
        <div className={s.magickaNet >= 0 ? "net-ok" : "net-bad"}>
          <dt>Итог магии</dt>
          <dd>
            {s.magickaNet >= 0 ? "+" : ""}
            {fmt1(s.magickaNet)} / с
            {s.magickaEmptyIn != null ? ` · пусто через ~${fmt1(s.magickaEmptyIn)} с` : " · держится"}
          </dd>
        </div>
        <div>
          <dt>Расход стамины</dt>
          <dd>{fmt1(s.staminaSpend)} / с</dd>
        </div>
        <div>
          <dt>Реген стамины</dt>
          <dd>{fmt1(s.staminaRegen)} / с</dd>
        </div>
        <div>
          <dt>Банка → стам</dt>
          <dd>
            {fmt(potion.stamina)} / {potionCooldown} с = {fmt1(s.staminaPotion)} / с
          </dd>
        </div>
        <div className={s.staminaNet >= 0 ? "net-ok" : "net-bad"}>
          <dt>Итог стамины</dt>
          <dd>
            {s.staminaNet >= 0 ? "+" : ""}
            {fmt1(s.staminaNet)} / с
            {s.staminaEmptyIn != null ? ` · пусто через ~${fmt1(s.staminaEmptyIn)} с` : " · держится"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
