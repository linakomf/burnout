import React, { useEffect, useId, useState } from 'react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';

export default function AdminMediaPathInput({
  label,
  value,
  onChange,
  required = false,
  hint = 'Например: /uploads/cover.jpg или /images/hero.png',
  allowImagesPrefix = true,
}) {
  const listId = useId();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/media/paths');
        if (cancelled) return;
        const uploads = Array.isArray(data?.uploads) ? data.uploads : [];
        const images = allowImagesPrefix && Array.isArray(data?.images) ? data.images : [];
        setOptions([...uploads, ...images]);
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [allowImagesPrefix]);

  const preview = value ? backendPublicUrl(value) : '';

  return (
    <div className="admin-media-path">
      {label ? (
        <label className="admin-label" htmlFor={listId}>
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <input
        id={listId}
        className="admin-input"
        type="text"
        list={`${listId}-dl`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        required={required}
      />
      <datalist id={`${listId}-dl`}>
        {options.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {preview ? (
        <div className="admin-media-path__preview">
          <img src={preview} alt="" />
        </div>
      ) : null}
    </div>
  );
}
