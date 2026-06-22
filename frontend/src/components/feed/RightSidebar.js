import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { AuthContext } from '../../hooks/AuthContext'
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia'
import User from '../../services/user'
import { apiOrigin } from '../../api/http'
import { useTranslation } from 'react-i18next'

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
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    color: "#E2E8F0",
    width: "100%",
    textAlign: "left",
    fontFamily: "inherit",
    fontSize: "13px",
    transition: "background 0.15s",
  },
  contactAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    fontSize: "13px",
    fontWeight: 700,
    flexShrink: 0,
    overflow: "hidden",
  },
  contactName: {
    fontWeight: 600,
    color: "#E2E8F0",
    fontSize: "13px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  empty: {
    padding: "24px 14px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "12px",
  },
}

export default function RightSidebar() {
  const { auth } = useContext(AuthContext)
  const { messages, fetchMyMessages, joinChat } = useMessagesAndMultimedia()
  const history = useHistory()

  const currentUserId = auth?._id
  const [userCache, setUserCache] = useState({})
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMyMessages().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const contacts = useMemo(() => {
    if (!currentUserId || !Array.isArray(messages)) return []
    const map = new Map()
    for (const m of messages) {
      if (!m) continue
      const sender = m.sender || m.senderId
      const receiver = m.receiver || m.receiverId
      if (String(sender) !== String(currentUserId)) continue
      if (!receiver) continue
      const existing = map.get(receiver)
      if (!existing) map.set(receiver, m)
      else {
        const tExisting = new Date(existing.createdAt || 0).getTime()
        const tNew = new Date(m.createdAt || 0).getTime()
        if (tNew > tExisting) map.set(receiver, m)
      }
    }
    return Array.from(map.entries())
      .map(([userId, lastMessage]) => ({ userId, lastMessage }))
      .sort((a, b) => new Date(b.lastMessage.createdAt || 0) - new Date(a.lastMessage.createdAt || 0))
      .slice(0, 8)
  }, [messages, currentUserId])

  const filteredContacts = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter((c) => {
      const u = userCache[c.userId] || {}
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      return fullName.includes(q) || email.includes(q)
    })
  }, [contacts, searchQuery, userCache])

  useEffect(() => {
    const unknown = contacts.map(c => c.userId).filter(id => id && !userCache[id])
    if (unknown.length === 0) return
    let mounted = true
    ;(async () => {
      for (const uid of unknown) {
        try {
          const resp = await User.searchUsers(uid)
          const data = resp?.data
          let users = []
          if (Array.isArray(data)) users = data
          else if (data?.data && Array.isArray(data.data)) users = data.data
          const found = users.find(u => u._id === uid)
          if (found && mounted) setUserCache(prev => ({ ...prev, [uid]: found }))
        } catch (err) {
          // ignore
        }
      }
    })()
    return () => { mounted = false }
  }, [contacts, userCache])

  function resolveProfilePhotoUrl(url) {
    if (!url) return null
    return url.startsWith('/') ? `${apiOrigin}${url}` : url
  }

  const handleOpenChat = (uid) => {
    try { joinChat(uid) } catch (_) {}
    history.push(`/chat/${uid}`)
  }

  const sponsored = [
    { id: 's1', title: 'Promoción local', image: '/assets/sponsored1.jpg', url: 'https://tuempresa.com', link: 'tuempresa.com' },
    { id: 's2', title: 'Ofertas cerca de ti', image: '/assets/sponsored2.jpg', url: 'https://ofertas.com', link: 'ofertas.com' },
    { id: 's3', title: 'Promoción local', image: '/assets/sponsored3.jpg', url: 'https://tutienda.com', link: 'tutienda.com' },
  ]

  return (
    <div style={styles.wrapper}>
      {/* Sponsored */}
      <div style={styles.section}>
        <div style={styles.header}>
          <div style={styles.headerBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span>Freeus Advertising</span>
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  {s.link}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div style={styles.section}>
        <div style={styles.contactsHeader}>
          <span>Contacts</span>
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
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
          {filteredContacts.length === 0 && (
            <div style={styles.empty}>No has escrito a nadie aún.</div>
          )}

          {filteredContacts.map((c) => {
            const user = userCache[c.userId] || {}
            const name = ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || user.name || user.email || `Usuario ${String(c.userId).slice(-4)}`
            const thumb = resolveProfilePhotoUrl(user.profilePhotoUrl || user.profilePhoto || user.photoUrl || user.photo || user.avatarUrl)
            return (
              <button key={c.userId} style={styles.contactItem}
                onClick={() => handleOpenChat(c.userId)}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(33,134,235,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={styles.contactAvatar}>
                  {thumb ? (
                    <img src={thumb} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (user.firstName && user.firstName[0]) || 'U'
                  )}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={styles.contactName}>{name}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
