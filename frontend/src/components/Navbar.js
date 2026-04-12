import React, { useContext, useState } from "react";
import { styled } from "../ui/styles";
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Link,
  MenuItem,
  Menu,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "../ui/material";
import { useHistory } from "react-router-dom";
import {
  ArrowDropDown as ArrowDropDownIcon,
  SupportAgent as SupportAgentIcon,
  QrCode as QrCodeIcon,
  Menu as MenuIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "../ui/icons";
import useAuth from "../hooks/useAuth";
import { AuthContext } from "../hooks/AuthContext";
import { useThemeMode } from "../ui/styles";
import { DRAWER_WIDTH_EXPANDED } from "./Sidebar";

const AppBarStyled = styled(MuiAppBar)(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH_EXPANDED,
    width: `calc(100% - ${DRAWER_WIDTH_EXPANDED}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function DashboardContent({ sidebarOpen, onMobileMenuToggle }) {
  const { auth } = useContext(AuthContext);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logoutUser } = useAuth();
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);

  const handleClickUserMenu = async (e, action) => {
    e.stopPropagation();

    if (action === "Logout") {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      await logoutUser().catch(() => {});
      setIsLoggingOut(false);
    } else if (action === "Mis billeteras") {
      history.push("/wallets");
    } else if (action === "Settings") {
      history.push("/settings");
    }

    setAnchorElUser(null);
  };

  const getAvatarColor = (name) => {
    const colors = ["#F6851B", "#3C3C3B", "#E8E8E8"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!auth) return null;

  const settings = [
    { label: `Hi, ${auth.firstName}`, icon: null },
    { label: "Mis billeteras", icon: <WalletIcon sx={{ mr: 1 }} /> },
    { label: "Settings", icon: <SettingsIcon sx={{ mr: 1 }} /> },
    { label: "Logout", icon: <LogoutIcon sx={{ mr: 1 }} /> },
  ];

  const navItems = [
    { href: "/welcome", label: "Crypto Soporte", Icon: SupportAgentIcon },
    { href: "/providers", label: "Vender P2P", Icon: QrCodeIcon },
    { href: "/create", label: "Proveedor P2P", Icon: QrCodeIcon },
  ];

  const navLinkStyle = {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
    margin: "0 8px",
  };

  const navIconStyle = {
    marginRight: "4px",
    display: "flex",
    alignItems: "center",
  };

  const renderNavLinks = () => (
    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
      {navItems.map(({ href, label, Icon }) => (
        <Link
          key={label}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          sx={navLinkStyle}
        >
          <Icon sx={navIconStyle} />
          <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "1rem" }}>
            {label}
          </Typography>
        </Link>
      ))}
    </Box>
  );

  const toggleButtonStyle = {
    color: "white",
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  };

  const avatarStyle = {
    bgcolor: getAvatarColor(auth.firstName),
    width: 35,
    height: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  };

  return (
    <AppBarStyled position="fixed" open={sidebarOpen} style={{ background: "linear-gradient(90deg, #2186EB 0%, #1A6BC7 100%)" }}>
      <Toolbar
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: "24px",
        }}
      >
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMobileMenuToggle}
            style={{ position: "absolute", left: 16 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", ml: 3 }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
          >
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Box
                style={{
                  width: 45,
                  height: 50,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  bgcolor: "#2186EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowDropDownIcon sx={{ color: "white", fontSize: 40 }} />
              </Box>

              <Typography
                variant="h6"
                style={{
                  fontWeight: 502,
                  color: "white",
                  lineHeight: 1,
                }}
              >
                BlockVault
              </Typography>
            </Box>
          </Link>
        </Box>

        {renderNavLinks()}

        <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tooltip title={isDark ? "Modo claro" : "Modo oscuro"}>
            <button
              onClick={toggleTheme}
              style={toggleButtonStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
              onMouseOut={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </button>
          </Tooltip>

          <Tooltip title="Open settings">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleOpenUserMenu(e);
              }}
              style={{ padding: 0 }}
            >
              <Avatar sx={avatarStyle}>
                {auth.firstName.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            style={{ marginTop: "45px" }}
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map(({ label, icon }) => (
              <MenuItem key={label} onClick={(e) => handleClickUserMenu(e, label)}>
                {icon}
                <Typography textAlign="center">{label}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBarStyled>
  );
}

export default function Navbar({ sidebarOpen, onMobileMenuToggle }) {
  return <DashboardContent sidebarOpen={sidebarOpen} onMobileMenuToggle={onMobileMenuToggle} />;
}
