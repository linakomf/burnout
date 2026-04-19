import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Flower2, LayoutGrid, Moon, Sparkles, Wind, Zap } from 'lucide-react';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import { PRACTICE_CATEGORIES, PRACTICES } from './practicesData';
import '../Tests/Tests.css';
import './Practices.css';

const CATEGORY_ICONS = {
  all: LayoutGrid,
  breath: Wind,
  focus: Zap,
  grounding: Sparkles,
  restore: Flower2,
  sleep: Moon,
};

function Practices() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => new Set(['night-exhale', 'focus-single']));
  const [selectedPractice, setSelectedPractice] = useState(null);

  const practicesByCategory = useMemo(
    () =>
      PRACTICES.filter(
        (practice) => activeCategory === 'all' || practice.category === activeCategory
      ),
    [activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const counts = { all: PRACTICES.length };
    PRACTICES.forEach((practice) => {
      counts[practice.category] = (counts[practice.category] || 0) + 1;
    });
    return counts;
  }, []);

  const toggleFavorite = (practiceId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(practiceId)) next.delete(practiceId);
      else next.add(practiceId);
      return next;
    });
  };

  return (
    <div className="tests-catalog-page tests-paths-page fade-in">
      <header className="tests-paths-hero">
        <div className="tests-paths-hero-glow" aria-hidden />
        <h1 className="tests-paths-title">
          <span className="tests-paths-title-ico" aria-hidden>
            <Flower2 size={28} strokeWidth={2} />
          </span>
          Практики
        </h1>
        <p className="tests-paths-lead">
          Формат такой же, как в тестах: фильтры, аккуратные карточки и быстрый запуск.
        </p>
      </header>

      <div className="tests-filter-bar" role="tablist" aria-label="Фильтр практик">
        {PRACTICE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id] || LayoutGrid;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tests-filter-chip ${isActive ? 'tests-filter-chip--active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="tests-filter-chip-ico" aria-hidden>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="tests-filter-chip-label">{category.label}</span>
              <span className="tests-filter-chip-count">{categoryCounts[category.id] || 0}</span>
            </button>
          );
        })}
      </div>

      <section className="tests-catalog-section practices-catalog-section" aria-label="Каталог практик">
        <h2 className="tests-section-title">Каталог практик</h2>
        <p className="tests-section-lead">Выбирайте карточку как в разделе тестов, но с запуском мини-сессии.</p>

        <div className="tests-catalog-grid">
          {practicesByCategory.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              isFavorite={favorites.has(practice.id)}
              onToggleFavorite={toggleFavorite}
              onPlay={setSelectedPractice}
              index={index}
            />
          ))}
        </div>
      </section>

      <div className="practices-footer-note card">
        <div className="practices-footer-row">
          <Flower2 size={16} />
          <span>{PRACTICES.length} практик в библиотеке</span>
          <span className="practices-dot" />
          <Wind size={16} />
          <span>{favorites.size} в избранном</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Practices;
