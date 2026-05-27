import React, { useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'contentPreferences',
    title: 'Что обычно помогает вам немного выдохнуть?',
    options: [
      { label: 'Музыка', tag: 'music' },
      { label: 'Фильмы или сериалы', tag: 'movies' },
      { label: 'Медитации и тишина', tag: 'meditation' },
      { label: 'Книги и статьи', tag: 'reading' },
      { label: 'Подкасты', tag: 'podcasts' },
      { label: 'События и прогулки', tag: 'events' },
    ],
  },
  {
    id: 'formatPreferences',
    title: 'Какой формат вам сейчас ближе?',
    options: [
      { label: 'Что-то короткое и лёгкое', tag: 'short' },
      { label: 'Спокойное и медленное', tag: 'calm' },
      { label: 'Что-то вдохновляющее', tag: 'inspiration' },
      { label: 'Хочу полностью отвлечься', tag: 'distraction' },
      { label: 'Что-то уютное', tag: 'cozy' },
    ],
  },
  {
    id: 'emotionalNeeds',
    title: 'Что вам сейчас нужно больше всего?',
    options: [
      { label: 'Отдых', tag: 'rest' },
      { label: 'Спокойствие', tag: 'peace' },
      { label: 'Поддержка', tag: 'support' },
      { label: 'Концентрация', tag: 'focus' },
      { label: 'Мотивация', tag: 'motivation' },
      { label: 'Эмоциональная разгрузка', tag: 'emotional-release' },
    ],
  },
  {
    id: 'difficulties',
    title: 'Что вам обычно сложнее всего?',
    options: [
      { label: 'Перестать тревожиться', tag: 'anxiety' },
      { label: 'Найти силы', tag: 'low-energy' },
      { label: 'Сконцентрироваться', tag: 'focus-problems' },
      { label: 'Отдохнуть без чувства вины', tag: 'rest-guilt' },
      { label: 'Переключиться от мыслей', tag: 'overthinking' },
    ],
  },
  {
    id: 'atmospherePreferences',
    title: 'Какая атмосфера вам ближе?',
    options: [
      { label: 'Тёплая и уютная', tag: 'warm' },
      { label: 'Спокойная и минималистичная', tag: 'minimal' },
      { label: 'Вдохновляющая', tag: 'inspiring' },
      { label: 'Лёгкая и весёлая', tag: 'light' },
      { label: 'Эстетичная и красивая', tag: 'aesthetic' },
    ],
  },
];

export default function SpaceOnboardingModal({ saving, onClose, onGoSpace, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [doneView, setDoneView] = useState(false);
  const q = QUESTIONS[step];
  const selected = Array.isArray(answers[q.id]) ? answers[q.id] : answers[q.id] ? [answers[q.id]] : [];

  const canNext = selected.length > 0;
  const isLast = step === QUESTIONS.length - 1;

  const payload = useMemo(() => {
    const out = {
      contentPreferences: [],
      formatPreferences: [],
      emotionalNeeds: [],
      difficulties: [],
      atmospherePreferences: [],
      completedAt: new Date().toISOString(),
    };
    QUESTIONS.forEach((item) => {
      const raw = answers[item.id];
      out[item.id] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    });
    return out;
  }, [answers]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="space-onb-title">
      <div className="modal-card fade-in" style={{ maxWidth: 760, width: 'min(96vw, 760px)' }}>
        <button
          type="button"
          className="modal-close"
          aria-label="Закрыть"
          onClick={onClose}
          disabled={saving}
        >
          <X size={20} />
        </button>

        {!doneView ? (
          <>
            <p style={{ margin: 0, color: '#6b6478', fontWeight: 700 }}>Подбор пространства</p>
            <h2 id="space-onb-title" style={{ margin: '8px 0 10px', fontSize: 28, lineHeight: 1.2 }}>
              {q.title}
            </h2>
            <p style={{ margin: '0 0 12px', color: '#7b7690', fontSize: 14 }}>Можно выбрать несколько вариантов</p>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {q.options.map((opt) => {
                const active = selected.includes(opt.tag);
                return (
                  <button
                    key={opt.tag}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => {
                        const cur = Array.isArray(prev[q.id]) ? prev[q.id] : prev[q.id] ? [prev[q.id]] : [];
                        const has = cur.includes(opt.tag);
                        const next = has ? cur.filter((t) => t !== opt.tag) : [...cur, opt.tag];
                        return { ...prev, [q.id]: next };
                      })
                    }
                    className={`tests-mock-chip tests-mock-chip--v2 ${active ? 'tests-mock-chip--active tests-mock-chip--v2-active' : ''}`}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '14px 16px' }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ color: '#7b7690', fontSize: 14 }}>
                Вопрос {step + 1} из {QUESTIONS.length}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {step > 0 ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={saving}
                  >
                    Назад
                  </button>
                ) : null}
                {!isLast ? (
                  <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext || saving}>
                    Дальше
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      if (!canNext || saving) return;
                      await onComplete(payload);
                      setDoneView(true);
                    }}
                    disabled={!canNext || saving}
                  >
                    {saving ? 'Сохраняем…' : 'Готово'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 id="space-onb-title" style={{ margin: '0 0 10px', fontSize: 30 }}>Ваше пространство готово 🌿</h2>
            <p style={{ margin: '0 0 12px', color: '#5f5870', lineHeight: 1.55 }}>
              Мы подобрали для вас более комфортный формат рекомендаций. Теперь на главной странице будут появляться фильмы, музыка, подкасты, медитации и материалы, которые лучше подходят вашему состоянию и интересам.
            </p>
            <p style={{ margin: '0 0 18px', color: '#6c6780' }}>
              Вы всегда сможете пройти подбор заново и изменить предпочтения.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                На главную
              </button>
              <button type="button" className="btn btn-primary" onClick={onGoSpace || onClose}>
                Перейти в пространство <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
