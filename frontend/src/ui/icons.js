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

export const ArrowDropDown = (props) => <Icon {...props}>▼</Icon>;
export const SupportAgent = (props) => <Icon {...props}>S</Icon>;
export const QrCode = (props) => <Icon {...props}>Q</Icon>;
export const Menu = (props) => <Icon {...props}>☰</Icon>;
export const AccountBalanceWallet = (props) => <Icon {...props}>W</Icon>;
export const Settings = (props) => <Icon {...props}>⚙</Icon>;
export const ExitToApp = (props) => <Icon {...props}>⏻</Icon>;
export const Visibility = (props) => <Icon {...props}>👁</Icon>;
export const VisibilityOff = (props) => <Icon {...props}>👁̸</Icon>;
export const Send = (props) => <Icon {...props}>↑</Icon>;
export const TrendingUp = (props) => <Icon {...props}>↑</Icon>;
export const SwapHoriz = (props) => <Icon {...props}>⇄</Icon>;
export const PersonAdd = (props) => <Icon {...props}>+</Icon>;
export const Check = (props) => <Icon {...props}>✓</Icon>;
export const Lock = (props) => <Icon {...props}>🔒</Icon>;
export const Security = (props) => <Icon {...props}>🛡</Icon>;
export const Person = (props) => <Icon {...props}>P</Icon>;
export const ArrowBack = (props) => <Icon {...props}>←</Icon>;
export const CheckCircle = (props) => <Icon {...props}>✓</Icon>;
export const Warning = (props) => <Icon {...props}>⚠</Icon>;
export const EmailOutlined = (props) => <Icon {...props}>✉</Icon>;
export const CheckCircleOutline = (props) => <Icon {...props}>◯</Icon>;
export const WarningAmber = (props) => <Icon {...props}>⚠</Icon>;
export const Wallet = (props) => <Icon {...props}>W</Icon>;
export const Twitter = (props) => <Icon {...props}>X</Icon>;
export const Facebook = (props) => <Icon {...props}>f</Icon>;
export const LinkedIn = <Icon>in</Icon>;
export const RecentActors = (props) => <Icon {...props}>👥</Icon>;
export const ContactMail = (props) => <Icon {...props}>✉</Icon>;
export const Language = (props) => <Icon {...props}>🌐</Icon>;
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