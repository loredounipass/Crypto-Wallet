import React from 'react';

export default function UserAvatar({ user, size = 40, onClick, title }) {
  const char = user?.firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U';
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
      {user?.profilePhotoUrl ? (
        <img src={user.profilePhotoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        char
      )}
    </div>
  );
}
