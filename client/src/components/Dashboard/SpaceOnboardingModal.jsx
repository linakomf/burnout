import React, { useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import {
  SPACE_ONBOARDING_QUESTIONS,
  buildSpacePreferencesPayload,
  spaceOnboardingTagLabel,
  spacePreferencesToAnswers,
} from '../../utils/spaceOnboardingData';
import '../Tests/Tests.css';
import './SpaceOnboardingModal.css';

function getSelectedForQuestion(answers, questionId) {
  const raw = answers[questionId];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export default function SpaceOnboardingModal({
  saving,
  initialPreferences = null,
  onClose,
  onGoSpace,
  onComplete,
}) {
  const isEditMode = Boolean(
    initialPreferences?.completedAt || hasInitialAnswers(initialPreferences)
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => spacePreferencesToAnswers(initialPreferences));
  const [doneView, setDoneView] = useState(false);

  const q = SPACE_ONBOARDING_QUESTIONS[step];
  const selected = getSelectedForQuestion(answers, q.id);
  const canNext = selected.length > 0;
  const isLast = step === SPACE_ONBOARDING_QUESTIONS.length - 1;

  const payload = useMemo(() => buildSpacePreferencesPayload(answers), [answers]);

  const toggleTag = (questionId, tag) => {
    setAnswers((prev) => {
      const cur = getSelectedForQuestion(prev, questionId);
      const has = cur.includes(tag);
      const next = has ? cur.filter((t) => t !== tag) : [...cur, tag];
      return { ...prev, [questionId]: next };
    });
  };

  const removeTag = (questionId, tag) => {
    setAnswers((prev) => {
      const cur = getSelectedForQuestion(prev, questionId);
      return { ...prev, [questionId]: cur.filter((t) => t !== tag) };
    });
  };

  const handleFinish = async () => {
    if (!canNext || saving) return;
    await onComplete(payload);
    setDoneView(true);
  };

  return (
    <div className="modal-overlay space-onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="space-onb-title">
      <div className="modal-card space-onboarding-card fade-in">
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
            <p className="space-onboarding-eyebrow">Подбор пространства</p>
            <h2 id="space-onb-title" className="space-onboarding-title">
              {q.title}
            </h2>
            <p className="space-onboarding-hint">
              {isEditMode
                ? 'Выбранные варианты подсвечены. Снимите крестиком то, что больше не подходит — рекомендации обновятся после сохранения.'
                : 'Можно выбрать несколько вариантов'}
            </p>

            {selected.length > 0 ? (
              <div className="space-onboarding-selected" aria-label="Выбрано на этом шаге">
                {selected.map((tag) => (
                  <span key={tag} className="space-onboarding-selected-chip">
                    <span className="space-onboarding-selected-chip-label">{spaceOnboardingTagLabel(tag)}</span>
                    <button
                      type="button"
                      className="space-onboarding-selected-chip-remove"
                      aria-label={`Убрать: ${spaceOnboardingTagLabel(tag)}`}
                      disabled={saving}
                      onClick={() => removeTag(q.id, tag)}
                    >
                      <X size={14} strokeWidth={2.5} aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="space-onboarding-options" role="group" aria-label={q.title}>
              {q.options.map((opt) => {
                const active = selected.includes(opt.tag);
                return (
                  <button
                    key={opt.tag}
                    type="button"
                    aria-pressed={active}
                    disabled={saving}
                    onClick={() => toggleTag(q.id, opt.tag)}
                    className={`tests-mock-chip tests-mock-chip--v2 space-onboarding-option ${
                      active ? 'tests-mock-chip--active tests-mock-chip--v2-active' : ''
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="space-onboarding-steps" aria-hidden>
              {SPACE_ONBOARDING_QUESTIONS.map((item, i) => {
                const count = getSelectedForQuestion(answers, item.id).length;
                return (
                  <span
                    key={item.id}
                    className={`space-onboarding-step-dot ${i === step ? 'is-current' : ''} ${
                      count > 0 ? 'has-answers' : ''
                    }`}
                    title={count > 0 ? `Выбрано: ${count}` : undefined}
                  />
                );
              })}
            </div>

            <div className="space-onboarding-footer">
              <div className="space-onboarding-progress">
                Вопрос {step + 1} из {SPACE_ONBOARDING_QUESTIONS.length}
              </div>
              <div className="space-onboarding-actions">
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext || saving}
                  >
                    Дальше
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinish}
                    disabled={!canNext || saving}
                  >
                    {saving ? 'Сохраняем…' : isEditMode ? 'Сохранить изменения' : 'Готово'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 id="space-onb-title" className="space-onboarding-title space-onboarding-title--done">
              {isEditMode ? 'Предпочтения обновлены 🌿' : 'Ваше пространство готово 🌿'}
            </h2>
            <p className="space-onboarding-done-text">
              {isEditMode
                ? 'Мы пересобрали рекомендации на главной с учётом вашего нового выбора. Убранные интересы больше не влияют на подбор.'
                : 'Мы подобрали для вас более комфортный формат рекомендаций. Теперь на главной странице будут появляться фильмы, музыка, подкасты, медитации и материалы, которые лучше подходят вашему состоянию и интересам.'}
            </p>
            {!isEditMode ? (
              <p className="space-onboarding-done-text space-onboarding-done-text--muted">
                Вы всегда сможете пройти подбор заново и изменить предпочтения.
              </p>
            ) : null}
            <div className="modal-actions space-onboarding-done-actions">
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

function hasInitialAnswers(prefs) {
  if (!prefs || typeof prefs !== 'object') return false;
  return SPACE_ONBOARDING_QUESTIONS.some((q) => {
    const raw = prefs[q.id];
    return Array.isArray(raw) ? raw.length > 0 : Boolean(raw);
  });
}
