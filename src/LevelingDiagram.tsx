import { EsoIcon } from "./EsoIcon";
import type { LevelingNode } from "./engine/compute";

const PHASE: Record<LevelingNode["phase"], string> = {
  start: "Старт",
  craft: "Крафт",
  drop: "Дроп",
  skills: "Скиллы",
  champion: "Чемпион",
};

export function LevelingDiagram({ nodes }: { nodes: LevelingNode[] }) {
  const phases = (["start", "craft", "drop", "skills", "champion"] as const).filter((p) =>
    nodes.some((n) => n.phase === p),
  );

  return (
    <section className="panel">
      <h2>Диаграмма прокачки</h2>
      <div className="diagram" role="list">
        {phases.map((phase, pi) => (
          <div key={phase} className="diagram-col" role="listitem">
            <h3>{PHASE[phase]}</h3>
            {nodes
              .filter((n) => n.phase === phase)
              .map((n) => (
                <article key={n.id} className={`diagram-node ${n.phase}`}>
                  <EsoIcon file={n.icon} alt={n.title} size={52} />
                  <div>
                    <strong>{n.title}</strong>
                  </div>
                </article>
              ))}
            {pi < phases.length - 1 && <div className="diagram-arrow" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>
  );
}
