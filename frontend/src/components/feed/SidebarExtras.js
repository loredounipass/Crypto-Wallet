import React from 'react'
import useRightSidebarLogic from './useRightSidebarLogic'

// SECCIONES BAJO DONACIONES EN LA COLUMNA IZQUIERDA: Brivo Links + Contacts
export default function SidebarExtras() {
  const { t, searchQuery, setSearchQuery, contacts, sponsored } = useRightSidebarLogic();

  return (
    <div className="fb-side-extras">
      {/* Brivo Links */}
      <div className="fb-side-section">
        <div className="fb-side-header">
          <div className="fb-side-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <span>Brivo Links</span>
        </div>
        <div>
          {sponsored.map(s => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="fb-side-link"
            >
              <div className="fb-side-thumb" style={{ backgroundImage: `url(${s.image})` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fb-side-title">{s.title}</div>
                <div className="fb-side-sub">Promotional Ad</div>
                <div className="fb-side-url">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {s.link}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Contacts — UI solamente, sin funciones por ahora */}
      <div className="fb-side-section">
        <div className="fb-side-header">
          <span>Contacts</span>
        </div>

        <div className="fb-side-search">
          <span className="fb-side-search-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            placeholder={t('chat.search_users')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="fb-side-input"
          />
        </div>

        <div>
          {contacts.length === 0 && (
            <div className="fb-side-empty">No has escrito a nadie aún.</div>
          )}
        </div>
      </div>
    </div>
  )
}
