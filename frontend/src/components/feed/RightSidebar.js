import React from 'react'
import useRightSidebarLogic from './useRightSidebarLogic'

const styles = {
  wrapper: {
    padding: "0 4px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#E2E8F0",
  },
  section: {
    borderRadius: "14px",
    border: "1px solid #2D2D44",
    backgroundColor: "#1A1A2E",
    overflow: "hidden",
    marginBottom: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    fontWeight: 600,
    fontSize: "13px",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #2D2D44",
  },
  headerBadge: {
    width: "24px",
    height: "24px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },
  sponsoredItem: {
    display: "flex",
    gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    textDecoration: "none",
    color: "#E2E8F0",
    transition: "background 0.15s",
  },
  sponsoredThumb: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    flexShrink: 0,
    backgroundColor: "#0F0F1A",
  },
  sponsoredTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#F1F5F9",
    lineHeight: 1.3,
  },
  sponsoredSub: {
    fontSize: "11px",
    color: "#64748B",
    marginTop: "1px",
  },
  sponsoredLink: {
    fontSize: "11px",
    color: "#2186EB",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
  },
  contactsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    fontWeight: 600,
    fontSize: "13px",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  searchWrap: {
    padding: "0 14px 8px",
    position: "relative",
  },
  searchInput: {
    width: "100%",
    background: "#0F0F1A",
    border: "1px solid #2D2D44",
    borderRadius: "10px",
    padding: "8px 12px 8px 32px",
    color: "#E2E8F0",
    fontSize: "12px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  searchIcon: {
    position: "absolute",
    left: "22px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#64748B",
    display: "flex",
  },
  empty: {
    padding: "24px 14px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "12px",
  },
}

export default function RightSidebar() {
  const { t, searchQuery, setSearchQuery, contacts, sponsored } = useRightSidebarLogic();

  return (
    <div style={styles.wrapper}>
      {/* Sponsored */}
      <div style={styles.section}>
        <div style={styles.header}>
          <div style={styles.headerBadge}>
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
              style={styles.sponsoredItem}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(33,134,235,0.04)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ ...styles.sponsoredThumb, backgroundImage: `url(${s.image})` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.sponsoredTitle}>{s.title}</div>
                <div style={styles.sponsoredSub}>Promotional Ad</div>
                <div style={styles.sponsoredLink}>
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
      <div style={styles.section}>
        <div style={styles.contactsHeader}>
          <span>Contacts</span>
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            placeholder={t('chat.search_users')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div>
          {contacts.length === 0 && (
            <div style={styles.empty}>No has escrito a nadie aún.</div>
          )}
        </div>
      </div>
    </div>
  )
}
