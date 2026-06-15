import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
  Avatar,
  Typography,
} from "../ui/material";
import { ChevronLeft } from "../ui/icons";
import { useHistory, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../hooks/AuthContext";
import useAuth from "../hooks/useAuth";
import Logo from './Logo';

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const SidebarIconBase = ({ children, style }) => {
  const size = style?.fontSize || 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
};

const DashboardIcon = (props) => (
  <SidebarIconBase {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </SidebarIconBase>
);

const WalletIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <circle cx="16" cy="11" r="1" />
  </SidebarIconBase>
);

const P2PIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M7 7h10" />
    <path d="M14 4l3 3-3 3" />
    <path d="M17 17H7" />
    <path d="M10 14l-3 3 3 3" />
  </SidebarIconBase>
);

const ProviderIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M3 10h18" />
    <path d="M5 10V7l2-3h10l2 3v3" />
    <path d="M5 10v9h14v-9" />
    <path d="M10 19v-5h4v5" />
  </SidebarIconBase>
);

const SupportIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M4 12a8 8 0 0 1 16 0" />
    <rect x="3" y="12" width="4" height="6" rx="1" />
    <rect x="17" y="12" width="4" height="6" rx="1" />
    <path d="M7 18a5 5 0 0 0 10 0" />
  </SidebarIconBase>
);

const SwapSidebarIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M16 3l4 4-4 4" />
    <path d="M20 7H4" />
    <path d="M8 21l-4-4 4-4" />
    <path d="M4 17h16" />
  </SidebarIconBase>
);

const FeedIcon = (props) => (
  <SidebarIconBase {...props}>
    <rect width="6" height="6" x="3" y="4" rx="1" />
    <rect width="6" height="6" x="3" y="14" rx="1" />
    <path d="M13 5h8" />
    <path d="M13 9h5" />
    <path d="M13 15h8" />
    <path d="M13 19h5" />
  </SidebarIconBase>
);

const NoticiasIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <rect x="10" y="6" width="8" height="5" rx="1" />
  </SidebarIconBase>
);

const SettingsIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </SidebarIconBase>
);

const ChevronLeftIcon = ChevronLeft;
const LogoutIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    <path d="M17 16l4-4-4-4" />
    <path d="M21 12H9" />
  </SidebarIconBase>
);

const menuItems = [
  { text: "Dashboard", icon: DashboardIcon, path: "/", matchPaths: ["/"] },
  { text: "Mis Billeteras", icon: WalletIcon, path: "/wallets", matchPaths: ["/wallets"] },
  { text: "P2P Trading", icon: P2PIcon, path: "/p2p", matchPaths: ["/p2p"] },
  { text: "Proveedor P2P", icon: ProviderIcon, path: "/create", matchPaths: ["/create", "/providerChat"] },
  { text: "Swap", icon: SwapSidebarIcon, path: "/swap", matchPaths: ["/swap"] },
  { text: "Feed", icon: FeedIcon, path: "/feed", matchPaths: ["/feed"] },
  { text: "Noticias", icon: NoticiasIcon, path: "/noticias", matchPaths: ["/noticias"] },
  { text: "Crypto Soporte", icon: SupportIcon, path: "/welcome", matchPaths: ["/welcome"] },
];

const bottomItems = [
  { text: "Ajustes", icon: SettingsIcon, path: "/settings" },
  { text: "Salir", icon: LogoutIcon, path: "logout", color: "#FF6B6B" },
];

export default function Sidebar({ open, onToggle, mobileOpen, onMobileClose }) {
  const history = useHistory();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  
  const { auth } = useContext(AuthContext);
  const { logoutUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleNavigation = (item) => {
    if (item.path === "logout") {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      logoutUser()
        .catch(() => {})
        .finally(() => {
          if (isMountedRef.current) setIsLoggingOut(false);
        });
    } else {
      history.push(item.path);
    }
    if (isMobile) {
      onMobileClose();
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#F6851B", "#3C3C3B", "#E8E8E8"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getListItemStyle = (isActive = false, itemColor) => {
    const isDanger = itemColor === "#FF6B6B";
    const activeColor = isDanger ? "#FF6B6B" : "#2186EB";
    const activeBg = isDanger ? "rgba(255, 107, 107, 0.1)" : "rgba(33, 134, 235, 0.1)";
    const activeBorder = isDanger ? "rgba(255, 107, 107, 0.2)" : "rgba(33, 134, 235, 0.2)";
    const defaultColor = isDanger ? "#FF6B6B" : "#8F95A3";

    return {
      color: isActive ? activeColor : defaultColor,
      minHeight: "48px",
      display: "flex",
      alignItems: "center",
      padding: open ? "10px 16px" : "10px",
      borderRadius: "12px",
      cursor: "pointer",
      justifyContent: open ? "flex-start" : "center",
      backgroundColor: isActive ? activeBg : "transparent",
      border: isActive ? `1px solid ${activeBorder}` : "1px solid transparent",
      transition: "all 0.2s ease",
      marginBottom: "8px",
    };
  };

  const checkIsActive = (item) => {
    if (item.matchPaths) {
      if (item.path === "/") {
        return location.pathname === "/";
      }
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
  };

  const sidebarContent = (
    <Box
      className="hide-scrollbar"
      style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      background: "#080811",
      width: isMobile ? "100%" : (open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED),
      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      overflowX: "hidden",
      overflowY: "auto",
      borderRight: "1px solid #1A1A2E",
    }}>
       {/* Logo Section */}
       <Box style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "64px", borderBottom: "1px solid #1A1A2E" }}>
         {open || isMobile ? (
           <>
             <Logo variant="sidebar-expanded" />
             <button
               onClick={isMobile ? onMobileClose : onToggle}
               style={{
                 width: "26px",
                 height: "26px",
                 borderRadius: "8px",
                 border: "1px solid #1F1F33",
                 background: "linear-gradient(135deg, rgba(33, 134, 235, 0.1), rgba(139, 92, 246, 0.08))",
                 color: "#8F95A3",
                 cursor: "pointer",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 transition: "all 0.25s ease",
                 flexShrink: 0,
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.background = "linear-gradient(135deg, rgba(33, 134, 235, 0.2), rgba(139, 92, 246, 0.15))";
                 e.currentTarget.style.borderColor = "rgba(33, 134, 235, 0.3)";
                 e.currentTarget.style.color = "#FFFFFF";
                 e.currentTarget.style.boxShadow = "0 0 12px rgba(33, 134, 235, 0.15)";
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.background = "linear-gradient(135deg, rgba(33, 134, 235, 0.1), rgba(139, 92, 246, 0.08))";
                 e.currentTarget.style.borderColor = "#1F1F33";
                 e.currentTarget.style.color = "#8F95A3";
                 e.currentTarget.style.boxShadow = "none";
               }}
             >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M15 18l-6-6 6-6" />
               </svg>
             </button>
           </>
           ) : (
             <Logo variant="sidebar-collapsed" />
           )}
       </Box>

       {/* User Info - Only when expanded */}
      {open && auth && (
        <Box style={{ 
          padding: "16px", 
          borderBottom: "1px solid #1A1A2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          textAlign: "left",
        }}>
          <Avatar 
            style={{ 
              backgroundColor: getAvatarColor(auth.firstName), 
              width: 32, 
              height: 32,
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {auth.firstName.charAt(0)}
          </Avatar>
          <Typography style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {auth.firstName} {auth.lastName || ''}
          </Typography>
        </Box>
      )}

      {/* Navigation Items */}
      <List style={{ flex: 1, padding: "12px", listStyle: "none", margin: 0 }}>
        {menuItems.map((item) => {
          const isActive = checkIsActive(item);
          return (
          <Tooltip
            key={item.text}
            title={!open ? item.text : ""}
            placement="right"
          >
            <ListItem
              onClick={() => handleNavigation(item)}
              style={getListItemStyle(isActive)}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ListItemIcon style={{ color: "inherit", minWidth: open ? "40px" : "auto", display: "flex", justifyContent: "center" }}>
                <item.icon style={{ fontSize: 20 }} />
              </ListItemIcon>
              { (open || isMobile) && (
                <ListItemText 
                  primary={item.text} 
                  style={{ fontSize: "14px", fontWeight: isActive ? 600 : 500, color: "inherit" }} 
                />
              )}
            </ListItem>
          </Tooltip>
          );
        })}
      </List>

      {/* Bottom Items (Settings & Logout) */}
      <Box style={{ 
        padding: "12px", 
        borderTop: "1px solid #1A1A2E",
      }}>
        {bottomItems.map((item) => {
          const isActive = checkIsActive(item);
          return (
          <Tooltip
            key={item.text}
            title={!open ? item.text : ""}
            placement="right"
          >
            <ListItem
              onClick={() => handleNavigation(item)}
              style={{
                ...getListItemStyle(isActive, item.color),
                opacity: item.path === "logout" && isLoggingOut ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = item.color ? "rgba(255,107,107,0.05)" : "rgba(255,255,255,0.03)";
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ListItemIcon style={{ color: "inherit", minWidth: open ? "40px" : "auto", display: "flex", justifyContent: "center" }}>
                <item.icon style={{ fontSize: 20 }} />
              </ListItemIcon>
              { (open || isMobile) && (
                <ListItemText 
                  primary={item.text} 
                  style={{ fontSize: "14px", fontWeight: isActive ? 600 : 500, color: "inherit" }} 
                />
              )}
            </ListItem>
          </Tooltip>
          );
        })}

        {/* Collapse toggle - only on desktop when collapsed */}
        {!open && !isMobile && (
          <Box style={{ display: "flex", justifyContent: "center", paddingTop: "4px", paddingBottom: "12px", marginTop: "-8px" }}>
            <button
              onClick={onToggle}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "1px solid #1F1F33",
                background: "linear-gradient(135deg, rgba(33, 134, 235, 0.1), rgba(139, 92, 246, 0.08))",
                color: "#8F95A3",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(33, 134, 235, 0.2), rgba(139, 92, 246, 0.15))";
                e.currentTarget.style.borderColor = "rgba(33, 134, 235, 0.3)";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(33, 134, 235, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(33, 134, 235, 0.1), rgba(139, 92, 246, 0.08))";
                e.currentTarget.style.borderColor = "#1F1F33";
                e.currentTarget.style.color = "#8F95A3";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Box>
        )}

        {/* Version - Only when expanded */}
        {open && (
          <Box style={{ textAlign: "center", marginTop: "8px" }}>
            <Typography style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
              BrivoTrust v1.0
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        transitionDuration={{ enter: 500, exit: 500 }}
        sx={{
          zIndex: 1200,
          '& .MuiDrawer-paper': {
            backgroundColor: '#080811',
            background: '#080811',
            borderRight: '1px solid #1A1A2E',
            boxShadow: 'none',
            padding: '0',
            margin: '0',
            borderRadius: '0',
            height: '100dvh',
            width: `${DRAWER_WIDTH_EXPANDED}px`,
            top: '0',
            left: '0',
            maxWidth: '100%',
          }
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <div 
      style={{ 
        width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED, 
        flexShrink: 0, 
        transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}>
       <div style={{ 
         height: "100vh", 
         width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
         background: "#080811",
         transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
       }}>
        {sidebarContent}
      </div>
    </div>
  );
}

export { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED };
