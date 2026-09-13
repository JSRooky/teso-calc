import { useMemo, useState } from "react";
import { GearPanel } from "./GearPanel";
import { SkillBars } from "./SkillBars";
import { classes, foods, mundus, races } from "./engine/catalog";
import {
  compute,
  levelingPlan,
  optimizeAttributes,
  remainingAttributes,
  suggestForGoal,
  type BuildInput,
} from "./engine/compute";
import { goals } from "./engine/goals";

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function App() {
  const [build, setBuild] = useState<BuildInput>(() => suggestForGoal("max-damage", "arcanist"));
  const result = useMemo(() => compute(build), [build]);
  const plan = useMemo(() => levelingPlan(build), [build]);
  const left = remainingAttributes(build.attributes);

  function patch(p: Partial<BuildInput>) {
    setBuild((b) => ({ ...b, ...p }));
  }

  function setAttr(key: "magicka" | "stamina" | "health", v: number) {
    const others = (["magicka", "stamina", "health"] as const).filter((k) => k !== key);
    const a = { ...build.attributes, [key]: v };
    let over = a.magicka + a.stamina + a.health - 64;
    for (const o of others) {
      if (over <= 0) break;
      const take = Math.min(a[o], over);
      a[o] -= take;
      over -= take;
    }
    patch({ attributes: a });
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">The Elder Scrolls Online</p>
        <h1>Калькулятор и планировщик билдов</h1>
        <p className="lede">
          Цель, затем слоты как в игре: крафтовые сеты (Julianos, Hunding, Гнев Ордена…) и дроп
          (триалы, данжи, монстры, мифики). Два бара 5+1 и зачарования CP160 gold.
        </p>
      </header>

      <section className="goals">
        {goals.map((g) => (
          <button
            key={g.id}
            className={build.goalId === g.id ? "goal on" : "goal"}
            onClick={() => setBuild(suggestForGoal(g.id, build.classId))}
            type="button"
          >
            <strong>{g.name}</strong>
            <span>{g.tagline}</span>
          </button>
        ))}
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Персонаж</h2>
          <label>
            Класс
            <select
              value={build.classId}
              onChange={(e) => setBuild(suggestForGoal(build.goalId, e.target.value))}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">{classes.find((c) => c.id === build.classId)?.description}</p>
          <label>
            Раса
            <select value={build.raceId} onChange={(e) => patch({ raceId: e.target.value })}>
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Камень Мундуса
            <select value={build.mundusId} onChange={(e) => patch({ mundusId: e.target.value })}>
              {mundus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.note}
                </option>
              ))}
            </select>
          </label>
          <label>
            Еда / напиток
            <select value={build.foodId} onChange={(e) => patch({ foodId: e.target.value })}>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <h3>Баффы в бою</h3>
          <div className="checks">
            {(
              [
                ["majorSorcery", "Major Sorcery (+20% сила заклинаний)"],
                ["majorBrutality", "Major Brutality (+20% сила оружия)"],
                ["majorIntellect", "Major Intellect (+30% реген магии)"],
                ["majorEndurance", "Major Endurance (+30% реген стамины)"],
                ["majorFortitude", "Major Fortitude (+30% реген ХП)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="check">
                <input
                  type="checkbox"
                  checked={build[key]}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Атрибуты · осталось {left}</h2>
          {(
            [
              ["magicka", "Магия"],
              ["stamina", "Запас сил"],
              ["health", "Здоровье"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label} · {build.attributes[key]}
              <input
                type="range"
                min={0}
                max={64}
                value={build.attributes[key]}
                onChange={(e) => setAttr(key, Number(e.target.value))}
              />
            </label>
          ))}
          <button
            className="ghost"
            type="button"
            onClick={() => {
              const { attributes, ...rest } = build;
              void attributes;
              patch({ attributes: optimizeAttributes(rest) });
            }}
          >
            Подобрать атрибуты под цель
          </button>
        </section>

        <section className="panel forecast">
          <h2>Прогноз характеристик</h2>
          <dl className="stats">
            <Stat k="Магия" v={fmt(result.stats.magicka)} />
            <Stat k="Запас сил" v={fmt(result.stats.stamina)} />
            <Stat k="Здоровье" v={fmt(result.stats.health)} />
            <Stat k="Сила заклинаний" v={fmt(result.stats.spellDamage)} />
            <Stat k="Сила оружия" v={fmt(result.stats.weaponDamage)} />
            <Stat k="Реген магии" v={`${fmt(result.stats.magickaRecovery)} / 2с`} />
            <Stat k="Реген стамины" v={`${fmt(result.stats.staminaRecovery)} / 2с`} />
            <Stat k="Реген ХП" v={`${fmt(result.stats.healthRecovery)} / 2с`} />
            <Stat
              k="Крит"
              v={`${pct(result.stats.critChance)} · ×${result.stats.critDamage.toFixed(2)}`}
            />
            <Stat k="Пробитие" v={fmt(result.stats.penetration)} />
            <Stat
              k="Сопр. физ / маг"
              v={`${fmt(result.stats.physicalResist)} / ${fmt(result.stats.spellResist)}`}
            />
            <Stat k="Оценка цели" v={fmt(Math.round(result.score))} />
          </dl>
        </section>
      </div>

      <GearPanel loadout={build.loadout} onChange={(loadout) => patch({ loadout })} />

      <SkillBars
        classId={build.classId}
        frontBar={build.frontBar}
        backBar={build.backBar}
        passiveIds={build.passiveIds}
        skillRanks={build.skillRanks}
        forecasts={result.skills}
        onFront={(frontBar) => patch({ frontBar })}
        onBack={(backBar) => patch({ backBar })}
        onPassives={(passiveIds) => patch({ passiveIds })}
        onRank={(id, rank) => patch({ skillRanks: { ...build.skillRanks, [id]: rank } })}
      />

      <section className="panel">
        <h2>Как прокачивать</h2>
        <ol className="plan">
          {plan.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer>
        Статы предметов — золото CP160, порядок величин UESP. Сеты: крафт собирается; остальное
        помечено как дроп (данж / триал / монстр / мифик / ПвП).
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
