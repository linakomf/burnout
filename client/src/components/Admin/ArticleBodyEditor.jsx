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
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handlePickImage = () => {
    setUploadError('');
    fileRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/reading/body-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = backendPublicUrl(data?.url || '');
      if (!url) throw new Error('empty url');

      const snippet = `\n\n<img src="${url}" alt="" class="article-inline-img" />\n\n`;
      const textarea = textareaRef.current;
      const { next, cursor } = insertSnippet(value, snippet, textarea);
      onChange(next);

      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    } catch {
      setUploadError('Не удалось загрузить изображение. Попробуйте другой файл.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="article-body-editor">
      <div className="article-body-editor__toolbar">
        <button
          type="button"
          className="btn btn-secondary btn-sm article-body-editor__insert-btn"
          onClick={handlePickImage}
          disabled={uploading}
        >
          <ImagePlus size={16} aria-hidden />
          {uploading ? 'Загрузка…' : 'Вставить изображение'}
        </button>
        <span className="article-body-editor__hint">
          Курсор в тексте — картинка вставится в это место
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        className="article-body-editor__file"
        onChange={handleImageSelected}
      />
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
