import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../hooks/AuthContext";

const Feed = () => {
  const { auth } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Carlos M.",
      avatar: "C",
      avatarColor: "#F6851B",
      content: "Acabo de hacer mi primer swap de BTC a ETH en BrivoTrust. ¡La velocidad es increíble! 🚀",
      time: "Hace 2 horas",
      likes: 12,
      comments: 3,
      liked: false,
    },
    {
      id: 2,
      author: "Ana R.",
      avatar: "A",
      avatarColor: "#8B5CF6",
      content: "¿Alguien más está viendo el rally de Solana? Subió un 15% en las últimas 24 horas. Buen momento para los holders. 📈",
      time: "Hace 4 horas",
      likes: 28,
      comments: 7,
      liked: true,
    },
    {
      id: 3,
      author: "Miguel T.",
      avatar: "M",
      avatarColor: "#2186EB",
      content: "Tip del día: Siempre verifiquen las direcciones de wallet antes de enviar. La seguridad es lo primero. 🔒",
      time: "Hace 6 horas",
      likes: 45,
      comments: 5,
      liked: false,
    },
    {
      id: 4,
      author: "Laura G.",
      avatar: "L",
      avatarColor: "#10B981",
      content: "Nuevo en el mundo cripto y BrivoTrust me ha facilitado todo. La interfaz P2P es muy intuitiva. ¡Recomendado! 💯",
      time: "Hace 8 horas",
      likes: 19,
      comments: 2,
      liked: false,
    },
  ]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePost = () => {
    if (!postText.trim()) return;
    const newPost = {
      id: Date.now(),
      author: auth ? `${auth.firstName} ${auth.lastName || ""}`.trim() : "Usuario",
      avatar: auth ? auth.firstName.charAt(0) : "U",
      avatarColor: "#2186EB",
      content: postText,
      time: "Justo ahora",
      likes: 0,
      comments: 0,
      liked: false,
    };
    setPosts([newPost, ...posts]);
    setPostText("");
  };

  const handleLike = (postId) => {
    setPosts(posts.map((p) =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const containerStyle = {
    padding: isMobile ? "4px" : "32px",
    maxWidth: "680px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <h1
        style={{
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: isMobile ? "20px" : "32px",
          marginBottom: "8px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        Feed
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0, marginBottom: "24px" }}>
        Comparte tus ideas y experiencias con la comunidad cripto.
      </p>

      {/* Create Post */}
      <div
        style={{
          background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
          borderRadius: "16px",
          padding: isMobile ? "16px" : "24px",
          border: "1px solid #1F1F33",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#2186EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {auth ? auth.firstName.charAt(0) : "U"}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="¿Qué está pasando en el mundo cripto?"
              style={{
                width: "100%",
                minHeight: "80px",
                background: "#0A0A18",
                border: "1px solid #1F1F33",
                borderRadius: "12px",
                padding: "14px",
                color: "#E2E8F0",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2186EB")}
              onBlur={(e) => (e.target.style.borderColor = "#1F1F33")}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                onClick={handlePost}
                disabled={!postText.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: postText.trim()
                    ? "linear-gradient(135deg, #2186EB, #1A6FCC)"
                    : "#1F1F33",
                  color: postText.trim() ? "#FFFFFF" : "#6B7280",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: postText.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  boxShadow: postText.trim() ? "0 4px 16px rgba(33, 134, 235, 0.3)" : "none",
                }}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
              borderRadius: "16px",
              padding: isMobile ? "16px" : "24px",
              border: "1px solid #1F1F33",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              transition: "border-color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#2D2D50")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#1F1F33")}
          >
            {/* Post Header */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: post.avatarColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                {post.avatar}
              </div>
              <div>
                <p style={{ color: "#E2E8F0", fontSize: "14px", fontWeight: 600, margin: 0 }}>
                  {post.author}
                </p>
                <p style={{ color: "#6B7280", fontSize: "12px", margin: 0 }}>{post.time}</p>
              </div>
            </div>

            {/* Post Content */}
            <p
              style={{
                color: "#D1D5DB",
                fontSize: isMobile ? "14px" : "15px",
                lineHeight: 1.6,
                margin: "0 0 16px 0",
              }}
            >
              {post.content}
            </p>

            {/* Post Actions */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                borderTop: "1px solid #1A1A2E",
                paddingTop: "14px",
              }}
            >
              <button
                onClick={() => handleLike(post.id)}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: post.liked ? "#EF4444" : "#6B7280",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? "#EF4444" : "none"} stroke={post.liked ? "#EF4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {post.likes}
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {post.comments}
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Compartir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
