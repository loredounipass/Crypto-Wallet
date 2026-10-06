import React, { use, useId } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import Toast from '../toasts/Toast';
import UserAvatar from '../common/UserAvatar';
import usePostFormLogic from './usePostFormLogic';
export default function PostForm({ onCreated }) {
  const { auth } = use(AuthContext);
  const fileInputId = useId();
  const {
    navigate, description, setDescription, files, previews, toast, setToast,
    expanded, setExpanded, submitting, processing, textareaRef, fileInputRef,
    onSubmit, handleFileChange, removeFile, MAX_FILES,
    handleDiscard, firstName, hasContent
  } = usePostFormLogic(auth, onCreated);
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
            <label className="fb-composer-tool" htmlFor={fileInputId} title="Subir fotos (máx. 10)">
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
              multiple
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
        if (!(expanded && files.length > 0)) return null;
        return (
          <div className="fb-post-expanded">
            <div className="fb-thumb-count">
              {files.length}/{MAX_FILES} foto{files.length > 1 ? 's' : ''}
              <button type="button" className="btn-secondary" style={{ margin: '0 0 0 10px', padding: '2px 10px', fontSize: 12 }} onClick={handleDiscard} disabled={busy}>
                Quitar todas
              </button>
            </div>
            <div className="fb-thumbs">
              {files.map((f, i) => (
                <div className="fb-thumb" key={`${f.name}-${f.size}-${i}`}>
                  {previews[i] && <img src={previews[i]} alt={`foto ${i + 1}`} />}
                  <button type="button" className="fb-thumb-x" onClick={() => removeFile(i)} disabled={busy} aria-label={`Quitar foto ${i + 1}`}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </form>
  );
}
