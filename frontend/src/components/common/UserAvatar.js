import React from 'react';
import { apiOrigin } from '../../api/http';

// RESOLVES A RELATIVE UPLOAD PATH TO THE ABSOLUTE API ORIGIN (CROSS-PORT DEV URLS)
export function resolvePhotoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    try {
      return `${apiOrigin}${url}`;
    } catch (_) {
      return url;
    }
  }
  return url;
}

export default function UserAvatar({ user, size = 40, onClick, title }) {
  const char = user?.firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U';
  const photoUrl = resolvePhotoUrl(user?.profilePhotoUrl);
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10B981, #2186EB)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden'
      }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        char
      )}
    </div>
  );
}
