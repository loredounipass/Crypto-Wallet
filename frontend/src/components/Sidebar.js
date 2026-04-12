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
import { ChevronLeft, ChevronRight, ArrowDropDown, LightMode, DarkMode } from "../ui/icons";
import { useHistory } from "react-router-dom";
import { useThemeMode } from "../ui/styles";
import { useContext } from "react";
import { AuthContext } from "../hooks/AuthContext";
import useAuth from "../hooks/useAuth";

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
const ChevronRightIcon = ChevronRight;
const ArrowDropDownIcon = ArrowDropDown;
const LightModeIcon = LightMode;
const DarkModeIcon = DarkMode;
const LogoutIcon = (props) => (
  <SidebarIconBase {...props}>
    <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    <path d="M17 16l4-4-4-4" />
    <path d="M21 12H9" />
  </SidebarIconBase>
);

const menuItems = [
  { text: "Dashboard", icon: DashboardIcon, path: "/" },
  { text: "Mis Billeteras", icon: WalletIcon, path: "/wallets" },
  { text: "Vender P2P", icon: P2PIcon, path: "/providers" },
  { text: "Proveedor P2P", icon: ProviderIcon, path: "/create" },
  { text: "Crypto Soporte", icon: SupportIcon, path: "/welcome" },
];

const bottomItems = [
  { text: "Ajustes", icon: SettingsIcon, path: "/settings" },
  { text: "Salir", icon: LogoutIcon, path: "logout", color: "#FF6B6B" },
];

export default function Sidebar({ open, onToggle, mobileOpen, onMobileClose }) {
  const { theme } = useThemeMode();
  const history = useHistory();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const isDark = theme?.palette?.mode === "dark";
  
  const { auth, setAuth } = useContext(AuthContext);
  const { logoutUser } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isDarkMode = mode === "dark";

  const handleNavigation = (item) => {
    if (item.path === "logout") {
      setAuth(null);
      logoutUser().catch(() => {});
      window.location.reload();
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

  const sidebarContent = (
    <Box style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      background: isDark
        ? "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)"
        : "linear-gradient(180deg, #2186EB 0%, #1A6BC7 100%)",
      width: open ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
      transition: "width 0.3s ease-in-out",
      overflowX: "hidden",
    }}>
      {/* Logo Section */}
      <Box style={{ 
        padding: "16px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: open ? "space-between" : "center",
        minHeight: "64px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        {open ? (
          <>
            <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Box
                style={{
                  width: 36,
                  height: 40,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  backgroundColor: "#2186EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowDropDownIcon style={{ color: "white", fontSize: 20 }} />
              </Box>
              <Typography style={{ color: "white", fontWeight: 600, fontSize: "18px" }}>
                BlockVault
              </Typography>
            </Box>
            <button
              onClick={onToggle}
              style={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeftIcon style={{ fontSize: 18 }} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            style={{
              color: "white",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRightIcon style={{ fontSize: 18 }} />
          </button>
        )}
      </Box>

      {/* Theme Toggle - Only when expanded */}
      {open && auth && (
        <Box style={{ 
          padding: "12px 16px", 
          display: "flex", 
          justifyContent: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <button
            onClick={toggleTheme}
            style={{
              color: "white",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            {isDarkMode ? <LightModeIcon style={{ fontSize: 16 }} /> : <DarkModeIcon style={{ fontSize: 16 }} />}
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>
        </Box>
      )}

      {/* User Info - Only when expanded */}
      {open && auth && (
        <Box style={{ 
          padding: "16px", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <Avatar 
            style={{ 
              backgroundColor: getAvatarColor(auth.firstName), 
              width: 40, 
              height: 40,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {auth.firstName.charAt(0)}
          </Avatar>
          <Box style={{ flex: 1, overflow: "hidden" }}>
            <Typography style={{ color: "white", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
              {auth.firstName}
            </Typography>
            <Typography style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              Usuario
            </Typography>
          </Box>
        </Box>
      )}

      {/* Navigation Items */}
      <List style={{ flex: 1, padding: "12px", listStyle: "none", margin: 0 }}>
        {menuItems.map((item) => (
          <Tooltip
            key={item.text}
            title={!open ? item.text : ""}
            placement="right"
          >
            <ListItem
              onClick={() => handleNavigation(item)}
              style={getListItemStyle()}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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
        ))}
      </List>

      {/* Bottom Items (Settings & Logout) */}
      <Box style={{ 
        padding: "12px", 
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}>
        {bottomItems.map((item) => (
          <Tooltip
            key={item.text}
            title={!open ? item.text : ""}
            placement="right"
          >
            <ListItem
              onClick={() => handleNavigation(item)}
              style={{
                ...getListItemStyle(),
                color: item.color || "white",
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = item.color ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.15)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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
        ))}

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
      >
        <div style={{ 
          width: DRAWER_WIDTH_EXPANDED, 
          height: "100%", 
          background: isDark ? "#1A1A2E" : "#2186EB" 
        }}>
          {sidebarContent}
        </div>
      </Drawer>
    );
  }

  return (
    <div style={{ 
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
        ...(isDark
          ? { background: "linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)" }
          : { background: "linear-gradient(180deg, #2186EB 0%, #1A6BC7 100%)" }),
        transition: "width 0.3s ease-in-out",
      }}>
        {sidebarContent}
      </div>
    </div>
  );
}

export { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED };
