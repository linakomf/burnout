import React from 'react';
import {
  AUDIENCE_GENDER_OPTIONS,
  AUDIENCE_ROLE_OPTIONS,
} from './audienceTargeting';

function AudienceChipGroup({ label, hint, options, value, onChange }) {
  return (
    <div className="admin-film-tag-group admin-audience-group">
      <div className="admin-film-tag-label">{label}</div>
      {hint ? <p className="admin-audience-hint">{hint}</p> : null}
      <div className="admin-film-tag-chips">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`admin-film-chip ${value === opt.id ? 'is-on' : ''}`}
            onClick={() => onChange(opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{ target_role: string, target_gender: string }} value
 * @param {(next: { target_role: string, target_gender: string }) => void} onChange
 */
export default function AdminAudienceFields({ value, onChange }) {
  const v = value || { target_role: 'all', target_gender: 'all' };

  return (
    <div className="admin-audience-fields">
      <p className="admin-film-filters-intro admin-audience-intro">
        Кому показывать на сайте. Теги по полу видны только в админке.
      </p>
      <AudienceChipGroup
        label="Роль"
        options={AUDIENCE_ROLE_OPTIONS}
        value={v.target_role || 'all'}
        onChange={(id) => onChange({ ...v, target_role: id })}
      />
      <AudienceChipGroup
        label="Дополнительно (не видно пользователям)"
        hint="Подбор по полу из профиля пользователя."
        options={AUDIENCE_GENDER_OPTIONS}
        value={v.target_gender || 'all'}
        onChange={(id) => onChange({ ...v, target_gender: id })}
      />
    </div>
  );
}
