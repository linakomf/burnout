import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../utils/api';
import './Stats.css';

const LEVEL_COLORS = { 'Низкий': '#B8D48A', 'Средний': '#F9C74F', 'Высокий': '#FF6B6B' };

const Stats = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tests/results/my')
      .then(res => setResults(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><div className="loading-spinner" /></div>;

  const chartData = results.slice(0, 10).reverse().map(r => {
    const t = r.title || 'Тест';
    const name = t.length > 15 ? `${t.slice(0, 15)}...` : t;
    return { name, score: r.score, level: r.level };
  });

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const lastLevel = results[0]?.level;
  const prevLevel = results[1]?.level;

  const getTrend = () => {
    const m = { 'Низкий': 0, 'Средний': 1, 'Высокий': 2 };
    if (!lastLevel || !prevLevel) return null;
    const diff = m[lastLevel] - m[prevLevel];
    if (diff < 0) return { icon: <TrendingDown size={16} />, label: 'Улучшение', color: '#B8D48A' };
    if (diff > 0) return { icon: <TrendingUp size={16} />, label: 'Ухудшение', color: '#FF6B6B' };
    return { icon: <Minus size={16} />, label: 'Без изменений', color: '#F9C74F' };
  };

  const trend = getTrend();

  return (
    <div className="stats-page fade-in">
      <h1 className="page-title">Моя статистика</h1>
      <p className="page-sub">Анализ ваших психологических показателей</p>

      {results.length === 0 ? (
        <div className="stats-empty card">
          <p>📊 Вы ещё не прошли ни одного теста</p>
          <a href="/tests" className="btn btn-primary" style={{ textDecoration: 'none' }}>Перейти к тестам</a>
        </div>
      ) : (
        <>
          <div className="stats-overview">
            <div className="stat-card card">
              <span className="stat-label">Пройдено тестов</span>
              <span className="stat-value">{results.length}</span>
            </div>
            <div className="stat-card card">
              <span className="stat-label">Средний балл</span>
              <span className="stat-value">{avgScore}</span>
            </div>
            <div className="stat-card card">
              <span className="stat-label">Последний уровень</span>
              <span className="stat-value" style={{ color: LEVEL_COLORS[lastLevel] || 'inherit' }}>
                {lastLevel || '—'}
              </span>
            </div>
            {trend && (
              <div className="stat-card card">
                <span className="stat-label">Тенденция</span>
                <span className="stat-value trend" style={{ color: trend.color }}>
                  {trend.icon} {trend.label}
                </span>
              </div>
            )}
          </div>

          {chartData.length > 1 && (
            <div className="card chart-card">
              <h2 className="card-title" style={{ marginBottom: 20 }}>История результатов</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8890c0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8890c0' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    formatter={(val, _, props) => [val, props.payload.level]}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={LEVEL_COLORS[entry.level] || '#BCC2F4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card results-list-card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>История тестов</h2>
            <div className="results-list">
              {results.map(r => {
                const rowDate = r.created_at ? new Date(r.created_at) : null;
                const dateLabel =
                  rowDate && !Number.isNaN(rowDate.getTime())
                    ? format(rowDate, 'd MMM yyyy, HH:mm', { locale: ru })
                    : '—';
                return (
                <div key={r.result_id} className="result-row">
                  <div className="result-row-left">
                    <span className="result-row-title">{r.title}</span>
                    <span className="result-row-date">{dateLabel}</span>
                  </div>
                  <div className="result-row-right">
                    <span className="result-row-score">{r.score} очков</span>
                    <span
                      className="badge"
                      style={{
                        background: `${LEVEL_COLORS[r.level]}22`,
                        color: LEVEL_COLORS[r.level],
                      }}
                    >
                      {r.level}
                    </span>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;
