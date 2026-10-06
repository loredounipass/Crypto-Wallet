import React from 'react';

/* Instagram-like carousel: arrows, dots, counter "2/5" and touch swipe */
export default function FeedCarousel({ urls }) {
  const [index, setIndex] = React.useState(0);
  const [failed, setFailed] = React.useState({});
  const touchX = React.useRef(null);
  const count = urls.length;

  if (!count) return null;

  const go = (dir) => {
    setIndex((i) => (i + dir + count) % count);
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const markFailed = (url) => {
    setFailed((prev) => {
      if (prev[url]) return prev;
      // Si todas fallan, el carrusel se oculta solo
      const next = { ...prev, [url]: true };
      return next;
    });
  };

  const visible = urls.filter((u) => !failed[u]);
  if (visible.length === 0) return null;
  const safeIndex = Math.min(index, visible.length - 1);

  return (
    <div
      className="fb-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="fb-carousel-track"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {visible.map((url) => (
          <div className="fb-carousel-slide" key={url}>
            <img
              src={url}
              alt="media"
              loading="lazy"
              draggable={false}
              onError={(e) => {
                const img = e.currentTarget;
                const retries = parseInt(img.dataset.retries || '0', 10);
                if (retries < 3) {
                  img.dataset.retries = retries + 1;
                  setTimeout(() => {
                    img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                  }, 1500);
                } else {
                  markFailed(url);
                }
              }}
            />
          </div>
        ))}
      </div>

      {visible.length > 1 && (
        <>
          <span className="fb-carousel-count">{safeIndex + 1}/{visible.length}</span>
          <button
            type="button"
            className="fb-carousel-arrow left"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="fb-carousel-arrow right"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Foto siguiente"
          >
            ›
          </button>
          <div className="fb-carousel-dots">
            {visible.map((url, i) => (
              <span
                key={url}
                className={i === safeIndex ? 'on' : ''}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
