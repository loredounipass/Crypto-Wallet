import React, { use } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import Toast from '../toasts/Toast';
import UserAvatar from '../common/UserAvatar';
import usePostFormLogic from './usePostFormLogic';
export default function PostForm() {
  const { auth } = use(AuthContext);
  const {
    navigate, description, setDescription, file, toast, setToast,
    expanded, setExpanded, submitting, textareaRef, onSubmit, handleFileChange,
    handleDiscard, firstName, hasContent, safePreviewUrl
  } = usePostFormLogic(auth);

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

