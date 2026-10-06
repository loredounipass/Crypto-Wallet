import React, { use, useId } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import Toast from '../toasts/Toast';
import UserAvatar from '../common/UserAvatar';
import usePostFormLogic from './usePostFormLogic';
export default function PostForm() {
  const { auth } = use(AuthContext);
  const fileInputId = useId();
  const {
    navigate, description, setDescription, file, toast, setToast,
    expanded, setExpanded, submitting, processing, textareaRef, fileInputRef,
    onSubmit, handleFileChange, handleDiscard, firstName, hasContent, safePreviewUrl
  } = usePostFormLogic(auth);
  const busy = submitting || processing;

  return (
    <form onSubmit={onSubmit} className="fb-post-form fb-composer">
      <div className="fb-composer-row">
        <div className="fb-avatar-ring sm">
          <UserAvatar
            user={auth}
            size={38}
            onClick={() => navigate('/profile')}
            title="Ir a mi perfil"
          />
        </div>

        <div className="fb-composer-field">
          <input
            ref={textareaRef}
            className="fb-composer-input"
            placeholder={`¿Qué estás pensando, ${firstName}?`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setExpanded(true)}
            autoComplete="off"
            enterKeyHint="send"
            aria-label="Escribe una publicación"
          />
          <div className="fb-composer-tools">
            <label className="fb-composer-tool" htmlFor={fileInputId} title="Subir imagen">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </label>

            <input
              id={fileInputId}
              ref={fileInputRef}
              className="fb-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />

            <button className="fb-composer-send" type="submit" disabled={busy || !hasContent} title="Publicar">
              {busy ? '…' : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Publicar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {(() => {
        if (!(expanded && (safePreviewUrl || file))) return null;
        return (
          <div className="fb-post-expanded">
            {file && (
              <div className="fb-attach-chip">
                <span className="fb-attach-name" title={file.name}>
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </span>
                <button type="button" className="fb-attach-x" onClick={handleDiscard} disabled={busy} aria-label="Quitar imagen">
                  ✕
                </button>
              </div>
            )}
            {safePreviewUrl && (
              <div className="fb-media">
                <img src={safePreviewUrl} alt="preview" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block', borderRadius: 10 }} />
              </div>
            )}
          </div>
        );
      })()}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </form>
  );
}
