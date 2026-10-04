import React from 'react'
import LeftSidebar from './LeftSidebar'
import PostForm from './PostForm'

// DRAWER MOVIL CON EL CONTENIDO DE LA COLUMNA IZQUIERDA
// (perfil, donaciones, Brivo Links, contacts). Se abre desde el icono
// de la barra superior en movil mediante el evento 'feed:toggle-extras'.
export default function FeedExtrasDrawer() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener('feed:toggle-extras', toggle);
    return () => window.removeEventListener('feed:toggle-extras', toggle);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open ]);

  if (!open) return null;

  return (
    <>
      <div className="fb-extras-backdrop" onClick={() => setOpen(false)} />
      <aside className="fb-extras-drawer" aria-label="Panel del feed">
        <button
          className="fb-extras-close"
          onClick={() => setOpen(false)}
          aria-label="Cerrar panel"
        >
          &times;
        </button>
        <LeftSidebar />
        <div style={{ marginTop: 12 }}>
          <PostForm />
        </div>
      </aside>
    </>
  )
}

export function toggleFeedExtras() {
  window.dispatchEvent(new CustomEvent('feed:toggle-extras'));
}
