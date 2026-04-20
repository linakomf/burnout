const LEVEL_STRESS = { Низкий: 30, Средний: 60, Высокий: 85 };

export function stressFromCatalogLevel(level) {
  if (!level) return null;
  return LEVEL_STRESS[level] ?? 40;
}

export function compositeStressPct({ onboardingPercent, lastTestStress, periodTestStress }) {
  const fromTests = periodTestStress != null ? periodTestStress : lastTestStress;
  if (onboardingPercent != null && fromTests != null) {
    return Math.min(100, Math.max(0, Math.round(onboardingPercent * 0.38 + fromTests * 0.62)));
  }
  if (fromTests != null) return Math.min(100, Math.max(0, fromTests));
  if (onboardingPercent != null) return Math.min(100, Math.max(0, onboardingPercent));
  return null;
}

export function compositeMoodPct({ diaryAvgMoodPct, stressPct, fallbackWhenNoDiary }) {
  const fromStress =
    stressPct != null
      ? Math.max(6, Math.min(100, 100 - Math.round(stressPct * 0.9)))
      : null;
  if (diaryAvgMoodPct > 0 && fromStress != null) {
    return Math.min(100, Math.max(0, Math.round(diaryAvgMoodPct * 0.55 + fromStress * 0.45)));
  }
  if (diaryAvgMoodPct > 0) return diaryAvgMoodPct;
  if (fromStress != null) return fromStress;
  return fallbackWhenNoDiary ?? 0;
}

export function compositeEnergyPct(moodPct, stressPct) {
  const m = moodPct ?? 0;
  const s = stressPct ?? 50;
  return Math.min(100, Math.max(0, Math.round(m * 0.45 + (100 - s) * 0.55)));
}

export function moodPercentFromOnboardingBurnout(onboardingPercent) {
  if (onboardingPercent == null || Number.isNaN(onboardingPercent)) return null;
  return Math.max(5, Math.min(100, Math.round(100 - onboardingPercent * 0.88)));
}

export function compositeAnxietyPct({ onboardingPercent, periodAnxietyFromTests }) {
  if (onboardingPercent != null && periodAnxietyFromTests != null) {
    return Math.min(
      100,
      Math.max(0, Math.round(onboardingPercent * 0.42 + periodAnxietyFromTests * 0.58))
    );
  }
  if (periodAnxietyFromTests != null) return Math.min(100, Math.max(0, periodAnxietyFromTests));
  if (onboardingPercent != null) {
    return Math.min(100, Math.max(0, Math.round(onboardingPercent * 0.92)));
  }
  return null;
}
