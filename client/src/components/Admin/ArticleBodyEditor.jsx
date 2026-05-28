import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';

function insertSnippet(value, snippet, textarea) {
  const start = textarea?.selectionStart ?? value.length;
  const end = textarea?.selectionEnd ?? value.length;
  const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
  const cursor = start + snippet.length;
  return { next, cursor };
}

export default function ArticleBodyEditor({ value, onChange, placeholder, rows = 12 }) {
  const textareaRef = useRef(null);
  const [imagePath, setImagePath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const insertImage = async () => {
    const path = imagePath.trim();
    if (!path) {
      setUploadError('Укажите путь к изображению (/uploads/... или /images/...).');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const { data } = await api.post('/reading/body-image', { image_path: path });
      const url = backendPublicUrl(data?.url || path);
      if (!url) throw new Error('empty url');

      const snippet = `\n\n<img src="${url}" alt="" class="article-inline-img" />\n\n`;
      const textarea = textareaRef.current;
      const { next, cursor } = insertSnippet(value, snippet, textarea);
      onChange(next);
      setImagePath('');

      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    } catch {
      setUploadError('Не удалось вставить изображение. Проверьте путь.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="article-body-editor">
      <div className="article-body-editor__toolbar">
        <input
          type="text"
          className="admin-input article-body-editor__path-input"
          value={imagePath}
          onChange={(e) => {
            setImagePath(e.target.value);
            setUploadError('');
          }}
          placeholder="/uploads/article-photo.jpg"
          aria-label="Путь к изображению"
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm article-body-editor__insert-btn"
          onClick={insertImage}
          disabled={uploading}
        >
          <ImagePlus size={16} aria-hidden />
          {uploading ? 'Вставка…' : 'Вставить изображение'}
        </button>
        <span className="article-body-editor__hint">
          Курсор в тексте — картинка вставится в это место
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className="article-body-editor__textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {uploadError ? (
        <p className="article-body-editor__error" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
