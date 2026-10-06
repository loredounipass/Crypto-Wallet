import React from 'react';
import { useParams } from 'react-router-dom';
import useForumProfile from '../hooks/useForumProfile';
import ForumProfileCoverHeader from '../components/forum-profile/ForumProfileCoverHeader';
import ForumProfileIdentityMeta from '../components/forum-profile/ForumProfileIdentityMeta';
import ForumProfileEditForm from '../components/forum-profile/ForumProfileEditForm';
import ForumProfilePostsWall from '../components/forum-profile/ForumProfilePostsWall';
import '../components/forum-profile/ForumProfile.css';
import '../components/feed/FeedStyles.css';

// FORUM PROFILE PAGE: COVER + IDENTITY + WALL (/profile/:id AND /profile FOR OWN)
export default function ForumProfilePage() {
  const { id } = useParams();
  const {
    profile, posts, loading, error, saving, uploading, uploadError, isOwnProfile,
    followBusy, saveForumFields, uploadAvatarPhoto, uploadCoverImage,
    followProfile, unfollowProfile,
  } = useForumProfile(id);
  const [editing, setEditing] = React.useState(false);

  const handleSave = async (fields) => {
    await saveForumFields(fields);
    setEditing(false);
  };

  const handleToggleFollow = async () => {
    if (profile?.isFollowing) await unfollowProfile();
    else await followProfile();
  };

  return (
    <div className="feed-layout-container fp-layout-mobile" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem', padding: '0', width: '100%', containerType: 'inline-size' }}>
      <div className="fb-list-wrapper fp-page">
        {loading && (
          <div className="fb-empty">Cargando perfil…</div>
        )}
        {!loading && error && (
          <div className="fb-empty" style={{ borderColor: '#F87171' }}>
            No se pudo cargar el perfil.
            <br />
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12, padding: '8px 20px',
                background: 'linear-gradient(135deg, var(--fn-teal), var(--fn-blue))',
                border: 'none', borderRadius: 20, color: '#fff',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        )}
        {!loading && !error && profile && (
          <>
            <div className="fp-card">
              <ForumProfileCoverHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                uploading={uploading}
                onAvatarFile={uploadAvatarPhoto}
                onCoverFile={uploadCoverImage}
              />
              <ForumProfileIdentityMeta
                profile={profile}
                isOwnProfile={isOwnProfile}
                onEdit={() => setEditing((v) => !v)}
                isFollowing={profile?.isFollowing}
                followersCount={profile?.followersCount}
                followingCount={profile?.followingCount}
                followBusy={followBusy}
                onToggleFollow={handleToggleFollow}
              />
              {uploadError && (
                <div style={{ margin: '0 18px 14px', padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', color: '#F87171', fontSize: 13 }}>
                  {uploadError}
                </div>
              )}
              {isOwnProfile && editing && (
                <ForumProfileEditForm
                  initialBio={profile.bio}
                  initialCountry={profile.country}
                  initialCurrencies={profile.currencies}
                  saving={saving}
                  onSave={handleSave}
                  onCancel={() => setEditing(false)}
                />
              )}
            </div>
            <h3 className="fp-wall-title">Publicaciones</h3>
            <ForumProfilePostsWall posts={posts} isFollowing={profile?.isFollowing} />
          </>
        )}
      </div>
    </div>
  );
}
