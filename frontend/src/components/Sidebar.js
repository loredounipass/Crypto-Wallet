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

const SettingsIcon = (props) => (
  <SidebarIconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M5.6 5.6l2.1 2.1" />
    <path d="M16.3 16.3l2.1 2.1" />
    <path d="M18.4 5.6l-2.1 2.1" />
    <path d="M7.7 16.3l-2.1 2.1" />
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
  const sidebarRef = React.useRef(null);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Auto open sidebar on mouse hover when collapsed
  React.useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement || isMobile) return;

    const handleMouseEnter = () => {
      if (!open) {
        onToggle();
      }
    };

    const handleMouseLeave = () => {
      // Collapse when mouse leaves the sidebar
      if (open) {
        onToggle();
      }
    };

    sidebarElement.addEventListener("mouseenter", handleMouseEnter);
    sidebarElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      sidebarElement.removeEventListener("mouseenter", handleMouseEnter);
      sidebarElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [open, onToggle, isMobile]);

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

  const getListItemStyle = (isActive = false) => ({
    color: "white",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    padding: open ? "10px 12px" : "10px",
    borderRadius: "8px",
    cursor: "pointer",
    justifyContent: open ? "flex-start" : "center",
    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
    transition: "background-color 0.2s",
    marginBottom: "4px",
  });

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
      background: "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)",
      width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
      transition: "width 0.3s ease-in-out",
      overflowX: "hidden",
      overflowY: "auto",
    }}>
       {/* Logo Section */}
       <Box className="p-4 flex items-center justify-between min-h-[64px] border-b border-white/10">
         {open ? (
           <>
             <Logo variant="sidebar-expanded" />
             <button
               onClick={onToggle}
               className="text-white bg-white/10 border-none rounded-lg p-1.5 cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors"
             >
               <ChevronLeftIcon style={{ fontSize: 18 }} />
             </button>
           </>
          ) : (
            <Logo variant="sidebar-collapsed" />
          )}
       </Box>

       {/* User Info - Only when expanded */}
      {open && auth && (
        <Box style={{ 
          padding: "8px", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          textAlign: "center",
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
          <Typography style={{ color: "white", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ListItemIcon style={{ color: "white", minWidth: open ? "40px" : "auto", display: "flex", justifyContent: "center" }}>
                <item.icon style={{ fontSize: 18 }} />
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={item.text} 
                  style={{ fontSize: "14px", fontWeight: 500, color: "white" }} 
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
        borderTop: "1px solid rgba(255,255,255,0.1)",
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
                ...getListItemStyle(isActive),
                color: item.color || "white",
                opacity: item.path === "logout" && isLoggingOut ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = item.color ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.15)";
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ListItemIcon style={{ color: item.color || "white", minWidth: open ? "40px" : "auto", display: "flex", justifyContent: "center" }}>
                <item.icon style={{ fontSize: 18 }} />
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={item.text} 
                  style={{ fontSize: "14px", fontWeight: 500, color: item.color || "white" }} 
                />
              )}
            </ListItem>
          </Tooltip>
          );
        })}

        {/* Version - Only when expanded */}
        {open && (
          <Box style={{ textAlign: "center", marginTop: "8px" }}>
            <Typography style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
              BlockVault v1.0
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
        style={{ position: "fixed", zIndex: 50 }}
        PaperProps={{
          style: {
            background: "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)",
            border: "none",
            boxShadow: "none",
          }
        }}
      >
       <div style={{ 
         width: DRAWER_WIDTH_EXPANDED, 
         height: "100%", 
         background: "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)",
         border: "none",
       }}>
          {sidebarContent}
        </div>
      </Drawer>
    );
  }

  return (
    <div 
      ref={sidebarRef}
      style={{ 
        width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED, 
        flexShrink: 0, 
        transition: "width 0.3s ease-in-out",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}>
       <div style={{ 
         height: "100vh", 
         width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
         background: "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)",
         transition: "width 0.3s ease-in-out",
       }}>
        {sidebarContent}
      </div>
    </div>
  );
}

export { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED };
