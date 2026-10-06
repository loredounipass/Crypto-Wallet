import React, { useRef } from 'react';
import UserAvatar, { resolvePhotoUrl } from '../common/UserAvatar';

// COVER + AVATAR + DISPLAY NAME HEADER (PHOTO UPLOAD CONTROLS FOR THE OWNER)
export default function ForumProfileCoverHeader({ profile, isOwnProfile, uploading, onAvatarFile, onCoverFile }) {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Usuario';

  const pickFile = (ref) => () => ref.current?.click();
  const onFile = (handler) => (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f && handler) handler(f);
  };

  return (
    <div className="fp-cover-wrap">
      <div className="fp-cover">
        {profile?.coverPhotoUrl ? (
          <img src={resolvePhotoUrl(profile.coverPhotoUrl)} alt="portada" className="fp-cover-img" />
        ) : (
          <div className="fp-cover-placeholder" aria-hidden="true" />
        )}
        {isOwnProfile && (
          <>
            <button
              type="button"
              className="fp-cover-edit"
              onClick={pickFile(coverInputRef)}
              disabled={uploading === 'cover'}
              title="Cambiar portada"
            >
              {uploading === 'cover' ? '…' : '✎ Portada'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="fb-file-input"
              onChange={onFile(onCoverFile)}
            />
          </>
        )}
      </div>
      <div className="fp-identity-row">
        <div className="fp-avatar-ring">
          <UserAvatar user={{ _id: profile?.owner, firstName: profile?.firstName, lastName: profile?.lastName, profilePhotoUrl: profile?.profilePhotoUrl }} size={76} />
          {isOwnProfile && (
            <>
              <button
                type="button"
                className="fp-avatar-edit"
                onClick={pickFile(avatarInputRef)}
                disabled={uploading === 'avatar'}
                title="Cambiar foto de perfil"
                aria-label="Cambiar foto de perfil"
              >
                {uploading === 'avatar' ? '…' : '✎'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="fb-file-input"
                onChange={onFile(onAvatarFile)}
              />
            </>
          )}
        </div>
        <div className="fp-identity-text">
          <h2 className="fp-name">{displayName}</h2>
          {profile?.country && <span className="fp-country">{String(profile.country).toUpperCase()}</span>}
        </div>
      </div>
    </div>
  );
}
