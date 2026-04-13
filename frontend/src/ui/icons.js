import React from "react";
import { mergeStyles } from "./sx";

const Icon = ({ children, sx, style, className }) => (
  <span
    className={className}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      lineHeight: 1,
      fontWeight: "normal",
      ...mergeStyles(sx, style),
    }}
  >
    {children}
  </span>
);

const SvgIcon = ({ children, sx, style, className, viewBox = "0 0 24 24" }) => (
  <span
    className={className}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      lineHeight: 1,
      ...mergeStyles(sx, style),
    }}
  >
    <svg
      viewBox={viewBox}
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  </span>
);

export const ArrowDropDown = (props) => <Icon {...props}>▼</Icon>;
export const SupportAgent = (props) => <Icon {...props}>S</Icon>;
export const QrCode = (props) => <Icon {...props}>Q</Icon>;
export const Menu = (props) => <Icon {...props}>☰</Icon>;
export const AccountBalanceWallet = (props) => <Icon {...props}>W</Icon>;
export const Settings = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.7.6.9.1.1.3.1.4.1H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
  </SvgIcon>
);
export const ExitToApp = (props) => <Icon {...props}>⏻</Icon>;
export const Visibility = (props) => (
  <SvgIcon {...props}>
    <path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);
export const VisibilityOff = (props) => (
  <SvgIcon {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.7 6.2A11 11 0 0 1 12 6c6.5 0 10.5 6 10.5 6a18 18 0 0 1-4.2 4.8" />
    <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
    <path d="M6.1 6.1A18 18 0 0 0 1.5 12s4 7 10.5 7c1.5 0 2.9-.3 4.2-.9" />
  </SvgIcon>
);
export const Send = (props) => <Icon {...props}>↑</Icon>;
export const TrendingUp = (props) => <Icon {...props}>↑</Icon>;
export const SwapHoriz = (props) => <Icon {...props}>⇄</Icon>;
export const PersonAdd = (props) => <Icon {...props}>+</Icon>;
export const Check = (props) => <Icon {...props}>✓</Icon>;
export const Lock = (props) => (
  <SvgIcon {...props}>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </SvgIcon>
);
export const Security = (props) => (
  <SvgIcon {...props}>
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
    <path d="M9.5 12.5l2 2 3.5-3.5" />
  </SvgIcon>
);
export const Person = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.8-3.5 4.6-5 8-5s6.2 1.5 8 5" />
  </SvgIcon>
);
export const ArrowBack = (props) => (
  <SvgIcon {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </SvgIcon>
);
export const CheckCircle = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </SvgIcon>
);
export const Warning = (props) => (
  <SvgIcon {...props}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 9v5" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </SvgIcon>
);
export const EmailOutlined = (props) => (
  <SvgIcon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M4 7l8 6 8-6" />
  </SvgIcon>
);
export const CheckCircleOutline = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </SvgIcon>
);
export const WarningAmber = (props) => (
  <SvgIcon {...props}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 9v5" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </SvgIcon>
);
export const Close = (props) => (
  <SvgIcon {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </SvgIcon>
);
export const Wallet = (props) => <Icon {...props}>W</Icon>;
export const Twitter = (props) => <Icon {...props}>X</Icon>;
export const Facebook = (props) => <Icon {...props}>f</Icon>;
export const LinkedIn = (props) => <Icon {...props}>in</Icon>;
export const RecentActors = (props) => <Icon {...props}>👥</Icon>;
export const ContactMail = (props) => <Icon {...props}>✉</Icon>;
export const Language = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18" />
    <path d="M12 3a15 15 0 0 0 0 18" />
  </SvgIcon>
);
export const LightMode = (props) => <Icon {...props}>☀</Icon>;
export const DarkMode = (props) => <Icon {...props}>☾</Icon>;
export const ChevronLeft = (props) => <Icon {...props}>‹</Icon>;
export const ChevronRight = (props) => <Icon {...props}>›</Icon>;
export const Add = (props) => <Icon {...props}>+</Icon>;
export const ArrowForward = (props) => <Icon {...props}>→</Icon>;
export const Dashboard = (props) => <Icon {...props}>⊞</Icon>;
export const Storefront = (props) => <Icon {...props}>S</Icon>;
export const Copy = (props) => <Icon {...props}>📋</Icon>;

export const Icons = {
  ArrowDropDown: "▼",
  SupportAgent: "S",
  QrCode: "Q",
  Menu: "☰",
  AccountBalanceWallet: "W",
  Settings: "⚙",
  ExitToApp: "⏻",
  Visibility: "👁",
  VisibilityOff: "👁̸",
  Send: "↑",
  TrendingUp: "↑",
  SwapHoriz: "⇄",
  PersonAdd: "+",
  Check: "✓",
  Lock: "🔒",
  Security: "🛡",
  Person: "P",
  ArrowBack: "←",
  CheckCircle: "✓",
  Warning: "⚠",
  EmailOutlined: "✉",
  CheckCircleOutline: "◯",
  WarningAmber: "⚠",
  Close: "✕",
  Wallet: "W",
  Twitter: "X",
  Facebook: "f",
  LinkedIn: "in",
  RecentActors: "👥",
  ContactMail: "✉",
  Language: "🌐",
  LightMode: "☀",
  DarkMode: "☾",
  ChevronLeft: "‹",
  ChevronRight: "›",
  Add: "+",
  ArrowForward: "→",
  Dashboard: "⊞",
  Storefront: "S",
};
