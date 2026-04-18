import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Heart,
  X,
  Flower2,
  LayoutGrid,
  Wind,
  Moon,
  Sparkles,
  Music,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import api from '../../utils/api';
import { buildDefaultPracticesPayload, buildOfflinePracticesPayload } from '../../data/practicesStatic';
import '../Tests/Tests.css';
import './Practices.css';

const PRACTICE_CATEGORY_ICONS = {
  all: LayoutGrid,
  breathing: Wind,
  meditation: Moon,
  affirmations: Sparkles,
  music: Music,
  quick: Zap,
};

function logSession(practiceKey, seconds) {
  return api.post('/practices/session', { practiceKey, durationSeconds: seconds }).catch(() => {});
}

/** Круговая анимация дыхания: ratio 0..1 — масштаб */
function BreathOrb({ label, ratio, sub }) {
  const scale = 0.65 + ratio * 0.45;
  return (
    <div className="pr-breath-stage">
      <div
        className="pr-breath-orb"
        style={{ transform: `scale(${scale})` }}
        aria-hidden
      />
      <p className="pr-breath-label">{label}</p>
      {sub && <p className="pr-breath-sub">{sub}</p>}
    </div>
  );
}

function PracticeModal({ practice, mode, onClose }) {
  const started = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (mode !== 'meditation' && mode !== 'quick') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    const pulseModes = ['generic', 'micro_break', 'calm_sound'];
    if (!pulseModes.includes(mode)) return undefined;
    const id = setInterval(() => setPulse((p) => p + 1), 120);
    return () => clearInterval(id);
  }, [mode]);

  const finish = useCallback(() => {
    const sec = Math.round((Date.now() - started.current) / 1000);
    logSession(practice.key, sec);
    onClose(true);
  }, [practice.key, onClose]);

  /* ─── Дыхание 4-7-8 ─── */
  if (mode === 'breath_478') {
    return (
      <Breath478 onDone={finish} onClose={() => onClose(false)} />
    );
  }
  if (mode === 'box_breathing') {
    return (
      <BreathBox onDone={finish} onClose={() => onClose(false)} />
    );
  }
  /* ─── Таймер медитации ─── */
  if (mode === 'meditation') {
    const total = (practice.durationMin || 5) * 60;
    const elapsed = Math.floor((now - started.current) / 1000);
    const left = Math.max(0, total - elapsed);
    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(left % 60).padStart(2, '0');
    return (
      <div className="pr-modal-overlay" role="dialog">
        <div className="pr-modal pr-modal--timer fade-in">
          <button type="button" className="pr-modal-close" onClick={() => onClose(false)} aria-label="Закрыть">
            <X size={22} />
          </button>
          <h2 className="pr-modal-title">{practice.title}</h2>
          <p className="pr-modal-desc">
            Закройте глаза или опустите взгляд. Мягко сканируйте ощущения от макушки к стопам.
          </p>
          <div className="pr-timer-display">{mm}:{ss}</div>
          {left === 0 && <p className="pr-timer-done">Пауза завершена</p>}
          <div className="pr-modal-actions">
            {left === 0 ? (
              <button type="button" className="btn btn-primary" onClick={finish}>
                Сохранить в статистику
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={finish}>
                Завершить сейчас
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  /* ─── 90 сек восстановление ─── */
  if (mode === 'quick') {
    const total = 90;
    const elapsed = Math.floor((now - started.current) / 1000);
    const left = Math.max(0, total - elapsed);
    const steps = [
      elapsed < 20 && 'Опустите плечи, вытяните шею.',
      elapsed >= 20 && elapsed < 45 && 'Взгляд в окно или вдаль — 20 секунд.',
      elapsed >= 45 && elapsed < 70 && 'Три медленных вдоха носом, выдох ртом.',
      elapsed >= 70 && 'Потрясите кистями рук, смягчите лицо.',
    ].filter(Boolean);
    return (
      <div className="pr-modal-overlay" role="dialog">
        <div className="pr-modal pr-modal--quick fade-in">
          <button type="button" className="pr-modal-close" onClick={() => onClose(false)}>
            <X size={22} />
          </button>
          <h2 className="pr-modal-title">{practice.title}</h2>
          <div className="pr-quick-seconds">{left} сек</div>
          <p className="pr-quick-hint">{steps[0] || 'Отлично. Сделайте глоток воды.'}</p>
          {left === 0 && (
            <button type="button" className="btn btn-primary" onClick={finish}>
              Готово
            </button>
          )}
        </div>
      </div>
    );
  }
  /* ─── 5-4-3-2-1 ─── */
  if (mode === 'grounding') {
    return <Grounding54321 onDone={finish} onClose={() => onClose(false)} />;
  }
  /* ─── Аффирмации ─── */
  if (mode === 'affirm') {
    const lines = [
      'Я могу замедлиться — это не слабость.',
      'Этот момент пройдёт; я дышу и опираюсь на факты.',
      'Я достаточно хорош(а) для того шага, который делаю сегодня.',
    ];
    return (
      <div className="pr-modal-overlay" role="dialog">
        <div className="pr-modal pr-modal--affirm fade-in">
          <button type="button" className="pr-modal-close" onClick={() => onClose(false)}>
            <X size={22} />
          </button>
          <h2 className="pr-modal-title">{practice.title}</h2>
          <ul className="pr-affirm-list">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={finish}>
            Прочитал(а), спасибо
          </button>
        </div>
      </div>
    );
  }
  /* ─── Микропауза / ритм ─── */
  return (
    <div className="pr-modal-overlay" role="dialog">
      <div className="pr-modal fade-in">
        <button type="button" className="pr-modal-close" onClick={() => onClose(false)}>
          <X size={22} />
        </button>
        <h2 className="pr-modal-title">{practice.title}</h2>
        <p className="pr-modal-desc">{practice.description}</p>
        <BreathOrb
          label="Спокойное дыхание"
          ratio={0.5 + 0.5 * Math.sin(pulse * 0.08)}
          sub="Следите за кругом 1–2 минуты"
        />
        <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={finish}>
          Завершить практику
        </button>
      </div>
    </div>
  );
}

function Breath478({ onDone, onClose }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const dur = [4, 7, 8];
  const cycle = dur.reduce((a, b) => a + b, 0);
  const t = tick % cycle;
  let acc = 0;
  let phaseIdx = 0;
  let secLeft = dur[0];
  for (let i = 0; i < dur.length; i += 1) {
    if (t < acc + dur[i]) {
      phaseIdx = i;
      secLeft = acc + dur[i] - t;
      break;
    }
    acc += dur[i];
  }
  const labels = ['Вдох', 'Задержка', 'Выдох'];
  const subs = ['4 секунды', '7 секунд', '8 секунд'];
  const ratio =
    phaseIdx === 2
      ? 0.5 + 0.5 * (secLeft / dur[2])
      : 0.58 + 0.42 * (secLeft / dur[phaseIdx]);

  return (
    <div className="pr-modal-overlay" role="dialog">
      <div className="pr-modal pr-modal--breath fade-in">
        <button type="button" className="pr-modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2 className="pr-modal-title">Дыхание 4-7-8</h2>
        <BreathOrb
          label={labels[phaseIdx]}
          sub={`${secLeft} сек · ${subs[phaseIdx]}`}
          ratio={Math.min(1, Math.max(0.5, ratio))}
        />
        <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={onDone}>
          Завершить
        </button>
      </div>
    </div>
  );
}

function BreathBox({ onDone, onClose }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const cycle = 16;
  const t = tick % cycle;
  const phaseIdx = Math.floor(t / 4);
  const secLeft = 4 - (t % 4);
  const labels = ['Вдох', 'Задержка', 'Выдох', 'Пауза'];
  const ratio = phaseIdx % 2 === 0 ? 0.55 + (secLeft / 4) * 0.45 : 1 - (secLeft / 4) * 0.45;

  return (
    <div className="pr-modal-overlay" role="dialog">
      <div className="pr-modal pr-modal--breath fade-in">
        <button type="button" className="pr-modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2 className="pr-modal-title">Квадратное дыхание 4-4-4-4</h2>
        <BreathOrb label={labels[phaseIdx]} sub={`${secLeft} сек`} ratio={Math.min(1, Math.max(0.5, ratio))} />
        <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={onDone}>
          Завершить
        </button>
      </div>
    </div>
  );
}

function Grounding54321({ onDone, onClose }) {
  const steps = [
    'Назовите 5 вещей, которые видите',
    '4 — что вы слышите',
    '3 — что чувствуете кожей (ткань, температура)',
    '2 — запаха рядом с вами',
    '1 — вкус или один глоток воды',
  ];
  const [i, setI] = useState(0);
  return (
    <div className="pr-modal-overlay" role="dialog">
      <div className="pr-modal fade-in">
        <button type="button" className="pr-modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2 className="pr-modal-title">5-4-3-2-1</h2>
        <p className="pr-ground-step">{steps[i]}</p>
        <div className="pr-modal-actions">
          {i < steps.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setI((x) => x + 1)}>
              Дальше
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              Завершить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function resolveMode(key) {
  if (key === 'breath_478') return 'breath_478';
  if (key === 'box_breathing') return 'box_breathing';
  if (key === 'meditation_body') return 'meditation';
  if (key === 'quick_reset') return 'quick';
  if (key === 'grounding_54321') return 'grounding';
  if (key === 'affirm_calm') return 'affirm';
  return 'generic';
}

const Practices = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(() => buildDefaultPracticesPayload());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [mode, setMode] = useState(null);

  const load = useCallback(() => {
    return api
      .get('/practices')
      .then((res) => setData(res.data))
      .catch(() => setData(buildOfflinePracticesPayload()))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async (e, key) => {
    e.stopPropagation();
    try {
      await api.post('/practices/favorite', { practiceKey: key });
      load();
    } catch {
      /* ignore */
    }
  };

  const openPractice = (p) => {
    setActive(p);
    setMode(resolveMode(p.key));
  };

  const closeModal = (saved) => {
    setActive(null);
    setMode(null);
    if (saved) load();
  };

  const filtered = data?.practices?.filter((p) => filter === 'all' || p.category === filter) || [];

  const filterCounts = useMemo(() => {
    const practices = data?.practices || [];
    const cats = data?.categories || {};
    const counts = { all: practices.length };
    Object.keys(cats).forEach((id) => {
      if (id === 'all') return;
      counts[id] = practices.filter((p) => (p.category || 'quick') === id).length;
    });
    return counts;
  }, [data?.practices, data?.categories]);

  return (
    <div className={`practices-page${loading ? ' practices-page--loading' : ''} fade-in`}>
      {loading && (
        <div className="practices-loading-bar" aria-hidden>
          <div className="loading-spinner practices-inline-spinner" />
        </div>
      )}
      <section className="pr-hero">
        <div className="pr-hero-inner">
          <Flower2 className="pr-hero-flower" size={28} strokeWidth={1.8} />
          <blockquote className="pr-hero-quote">
            «Воспоминания начинаются не с фокуса, а с присутствия»
          </blockquote>
          <p className="pr-hero-sub">Будьте здесь и сейчас</p>
        </div>
      </section>

      {data.personalizedHint && (
        <p className="pr-hint">{data.personalizedHint}</p>
      )}

      <div className="tests-filter-bar" role="tablist" aria-label="Фильтр по типу практики">
        {Object.entries(data.categories || {}).map(([id, label]) => {
          const count = filterCounts[id] ?? 0;
          const active = filter === id;
          const Icon = PRACTICE_CATEGORY_ICONS[id] || MoreHorizontal;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`tests-filter-chip ${active ? 'tests-filter-chip--active' : ''}`}
              onClick={() => setFilter(id)}
            >
              <span className="tests-filter-chip-ico" aria-hidden>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="tests-filter-chip-label">{label}</span>
              <span className="tests-filter-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="tests-catalog-empty">Нет практик в этой категории. Выберите другой фильтр.</p>
      ) : (
        <div className="pr-grid">
          {filtered.map((p) => (
            <article
              key={p.key}
              className="pr-card"
              data-category={p.category || 'quick'}
            >
              <button
                type="button"
                className={`pr-fav ${p.isFavorite ? 'on' : ''}`}
                aria-label="Избранное"
                onClick={(e) => toggleFavorite(e, p.key)}
              >
                <Heart size={18} fill={p.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <div className="pr-card-body">
                <h3 className="pr-card-title">{p.title}</h3>
                <p className="pr-card-desc">{p.description}</p>
              </div>
              <div className="pr-card-foot">
                <button
                  type="button"
                  className="pr-play"
                  aria-label="Начать"
                  onClick={() => openPractice(p)}
                >
                  <Play size={20} fill="currentColor" />
                </button>
                <span className="pr-duration">{p.durationMin} мин</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className="pr-stats-bar">
        <div className="pr-stat">
          <span className="pr-stat-num">{data.stats?.available ?? 0}</span>
          <span className="pr-stat-label">Практик доступно</span>
        </div>
        <div className="pr-stat">
          <span className="pr-stat-num">{data.stats?.favorites ?? 0}</span>
          <span className="pr-stat-label">В избранном</span>
        </div>
        <div className="pr-stat">
          <span className="pr-stat-num">{data.stats?.minutesTotal ?? 0}</span>
          <span className="pr-stat-label">Минут практик</span>
        </div>
      </footer>

      <div className="pr-footer-links">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/tests')}>
          К тестам
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/stats')}>
          Аналитика
        </button>
      </div>

      {active &&
        typeof document !== 'undefined' &&
        createPortal(
          <PracticeModal practice={active} mode={mode} onClose={closeModal} />,
          document.body
        )}
    </div>
  );
};

export default Practices;
