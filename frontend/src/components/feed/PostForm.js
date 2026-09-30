import React, { useState, use, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFeed from '../../hooks/useFeed';
import { AuthContext } from '../../hooks/AuthContext';
import Toast from '../toasts/Toast';
import UserAvatar from '../common/UserAvatar';

export default function PostForm() {
  const navigate = useNavigate();
  const { createPostWithFile, createPost } = useFeed();
  const { auth } = use(AuthContext);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);
  useCleanupPreview(previewUrl);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent double-click
    setSubmitting(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("description", (description || '').trim());
        formData.append("type", "image");

        await createPostWithFile(formData);
      } else {
        await createPost({ description, type: 'text', authorId: auth._id });
      }
      setDescription('');
      setFile(null);
      setExpanded(false);
      if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { }; setPreviewUrl(null); }
      if (e.target?.reset) e.target.reset();
    } catch (err) {
      console.error(err);
      setToast(err?.response?.data?.message || err?.message || 'Error creando el post');
    } finally {
      setSubmitting(false);
    }
  };



  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (toast) setToast('');
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { } }
    if (!f) { setFile(null); setPreviewUrl(null); return; }

    if (!f.type?.startsWith('image/')) {
      setToast('Solo se permiten imágenes (JPG, PNG, GIF, WebP).');
      setFile(null); setPreviewUrl(null); e.target.value = '';
      return;
    }

    const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
    if (f.size > MAX_IMAGE_SIZE) {
      setToast('La imagen no puede superar 15 MB.');
      setFile(null); setPreviewUrl(null); e.target.value = '';
      return;
    }

    setFile(f);
    try { setPreviewUrl(URL.createObjectURL(f)); } catch (_) { setPreviewUrl(null); }
    setExpanded(true);
  };

  const handleDiscard = (e) => {
    e.preventDefault();
    setDescription('');
    setFile(null);
    setExpanded(false);
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { }; setPreviewUrl(null); }
    const input = document.getElementById('post-file-input');
    if (input) input.value = '';
  };

  const displayName = auth ? `${auth.firstName || ''}`.trim() || auth.username || 'Tú' : 'Tú';
  const firstName = displayName.split(' ')[0];
  const hasContent = file || description.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="fb-post-form">
      <div className="fb-post-bar">
        <UserAvatar
          user={auth}
          size={36}
          onClick={() => navigate('/profile')}
          title="Ir a mi perfil"
        />

        <input
          ref={textareaRef}
          className="fb-post-input"
          placeholder={`¿Qué estás pensando, ${firstName}?`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setExpanded(true)}
        />

        <div className="fb-post-actions">
          <label className="fb-post-icon-btn" htmlFor="post-file-input" title="Subir imagen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </label>

          <input
            id="post-file-input"
            className="fb-file-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
          />

          <button className="fb-btn-primary" type="submit" disabled={submitting || !hasContent}>
            {submitting ? '…' : 'Publicar'}
          </button>
        </div>
      </div>

      {(() => {
        const safePreviewUrl = getSafePreviewUrl(previewUrl);
        if (!(expanded && (safePreviewUrl || file))) return null;
        return (
          <div className="fb-post-expanded">
            {file && <span className="fb-file-name" title={file.name}>{file.name}</span>}
            {safePreviewUrl && (
              <div className="fb-media">
                <img src={safePreviewUrl} alt="preview" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block', borderRadius: 10 }} />
              </div>
            )}
            <button type="button" className="btn-secondary" onClick={handleDiscard} disabled={submitting}>
              Descartar
            </button>
          </div>
        );
      })()}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </form>
  );
}

function getSafePreviewUrl(url) {
  if (typeof url !== 'string') return null;
  return url.startsWith('blob:') ? url : null;
}

function useCleanupPreview(url) {
  useEffect(() => {
    return () => { if (url) { try { URL.revokeObjectURL(url); } catch (_) { } } };
  }, [url]);
}
