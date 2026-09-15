import { applySustainFix, suggestSustainFixes, type FixAction } from "./engine/sustainFixes";
import type { BuildInput, DerivedStats } from "./engine/compute";
import { computeSustain } from "./engine/sustain";

const CAT: Record<string, string> = {
  set: "Сет",
  food: "Еда / напиток",
  mundus: "Мундус",
  enchant: "Зачарование",
  potion: "Банка",
  buff: "Бафф",
};

function fmt1(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 1, signDisplay: "exceptZero" });
}

export function SustainFixes({
  build,
  stats,
  potionId,
  potionCooldown,
  onApply,
  onPotion,
}: {
  build: BuildInput;
  stats: DerivedStats;
  potionId: string;
  potionCooldown: number;
  onApply: (patch: Partial<BuildInput>) => void;
  onPotion: (id: string) => void;
}) {
  const sustain = computeSustain(build, stats, potionId, potionCooldown);
  const magProblem = sustain.magickaNet < 0;
  const stamProblem = sustain.staminaNet < 0;
  if (!magProblem && !stamProblem) return null;

  const tips = suggestSustainFixes(build, sustain, potionId, potionCooldown);
  const maxTips = tips.filter((t) => t.tier === "max");
  const nearTips = tips.filter((t) => t.tier === "near");

  function run(action?: FixAction) {
    if (!action) return;
    if (action.type === "potion") {
      onPotion(action.id);
      return;
    }
    onApply(applySustainFix(build, action));
  }

  return (
    <section className="panel">
      <h2>Как закрыть расход</h2>
      <FixGroup title="Максимум сустейна" tips={maxTips} onRun={run} />
      <FixGroup title="Близкие варианты" tips={nearTips} onRun={run} />
    </section>
  );
}

function FixGroup({
  title,
  tips,
  onRun,
}: {
  title: string;
  tips: ReturnType<typeof suggestSustainFixes>;
  onRun: (a?: FixAction) => void;
}) {
  if (!tips.length) return null;
  return (
    <div className="fix-group">
      <h3>{title}</h3>
      <div className="fix-grid">
        {tips.map((t) => (
          <article
            key={t.id}
            className={`fix-card${t.already ? " on" : ""}${t.preview?.closes ? " closes" : ""}`}
          >
            <header>
              <em>
                {CAT[t.category]} · {t.pool === "magicka" ? "маг" : "стам"}
              </em>
              <strong>{t.title}</strong>
            </header>
            <p className="hit">{t.gain}</p>
            {t.preview && (
              <div className="balance">
                <div className="balance-bar" style={{ width: `${t.preview.score}%` }} />
                <span title={t.preview.label}>
                  {t.preview.score} · {t.preview.label}
                </span>
                <span>
                  {fmt1(t.preview.magickaNet)}/{fmt1(t.preview.staminaNet)} ·{" "}
                  {fmt1(t.preview.damageDeltaPct)}%
                </span>
              </div>
            )}
            {t.already ? (
              <span className="hint">Уже стоит</span>
            ) : t.action ? (
              <button type="button" className="ghost" onClick={() => onRun(t.action)}>
                Поставить
              </button>
            ) : (
              <span className="hint">Вручную</span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
