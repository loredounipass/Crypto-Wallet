import React, { useState, useEffect } from 'react';
import { get } from '../../api/http';

const SecureAudio = ({ url, ...props }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!url) return;

    get(url, null, { responseType: 'blob' })
      .then(res => {
        if (active && res && res.data) {
          setBlobUrl(URL.createObjectURL(res.data));
        }
      })
      .catch(err => {
        console.error('Failed to load secure audio:', err);
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (error) {
    return (
      <div style={{ width: '240px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', borderRadius: '12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        ⚠️ Error al cargar el audio.
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div style={{ width: '240px', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', borderRadius: '24px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#A78BFA', animation: 'pulse 1.5s infinite' }} />
        Descargando audio...
      </div>
    );
  }

  return <audio src={blobUrl} {...props} />;
};

export default SecureAudio;
