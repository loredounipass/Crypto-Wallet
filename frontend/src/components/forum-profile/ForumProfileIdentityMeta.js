import React from 'react';

// BIO + COUNTRY + TRADING CURRENCIES + P2P BADGE + FOLLOWERS + FOLLOW BUTTON
export default function ForumProfileIdentityMeta({
  profile, isOwnProfile, onEdit,
  isFollowing, followersCount, followingCount, followBusy, onToggleFollow,
}) {
  const currencies = Array.isArray(profile?.currencies) ? profile.currencies : [];
  return (
    <div className="fp-meta">
      {profile?.bio && <p className="fp-bio">{profile.bio}</p>}
      <div className="fp-meta-row">
        {profile?.p2pRegistered && (
          <span className="fp-p2p-badge" title="Vendedor verificado P2P">
            ✓ P2P verificado
          </span>
        )}
        <span className="fp-posts-count">
          <strong>{followersCount ?? 0}</strong> seguidor{(followersCount ?? 0) !== 1 ? 'es' : ''}
        </span>
        <span className="fp-posts-count">
          <strong>{followingCount ?? 0}</strong> seguidos
        </span>
        <span className="fp-posts-count">
          {profile?.postsCount ?? 0} publicacion{(profile?.postsCount ?? 0) !== 1 ? 'es' : ''}
        </span>
        {isOwnProfile ? (
          <button type="button" className="fp-edit-btn" onClick={onEdit}>
            Editar perfil
          </button>
        ) : (
          <div className="fp-action-btns">
            <button
              type="button"
              className={isFollowing ? 'fp-follow-btn following' : 'fp-follow-btn'}
              onClick={onToggleFollow}
              disabled={followBusy}
            >
              {followBusy ? '…' : (isFollowing ? 'Siguiendo' : '+ Seguir')}
            </button>
            <button type="button" className="fp-chat-btn" title="Chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
            </button>
          </div>
        )}
      </div>
      {currencies.length > 0 && (
        <div className="fp-currencies">
          <span className="fp-currencies-label">Opera:</span>
          {currencies.map((c) => (
            <span key={c} className="fp-currency-chip">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
