const SPACING_UNIT = 8;

const spacingKeys = {
  m: "margin",
  mt: "marginTop",
  mr: "marginRight",
  mb: "marginBottom",
  ml: "marginLeft",
  mx: ["marginLeft", "marginRight"],
  my: ["marginTop", "marginBottom"],
  p: "padding",
  pt: "paddingTop",
  pr: "paddingRight",
  pb: "paddingBottom",
  pl: "paddingLeft",
  px: ["paddingLeft", "paddingRight"],
  py: ["paddingTop", "paddingBottom"],
};

const breakpoints = ["xs", "sm", "md", "lg", "xl"];

const getResponsiveValue = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  for (const key of breakpoints) {
    if (value[key] !== undefined) return value[key];
  }
  return undefined;
};

const parseSpacingValue = (value) => {
  if (typeof value === "number") return `${value * SPACING_UNIT}px`;
  return value;
};

const normalizeValue = (value) => {
  if (typeof value === "function") return value(defaultTheme);
  const responsiveValue = getResponsiveValue(value);
  if (responsiveValue === undefined) return undefined;
  if (typeof responsiveValue === "function") return responsiveValue(defaultTheme);
  return responsiveValue;
};

export const sxToStyle = (sx) => {
  if (!sx) return {};

  const resolved = typeof sx === "function" ? sx(defaultTheme) : sx;
  if (!resolved || typeof resolved !== "object") return {};

  const style = {};

  Object.entries(resolved).forEach(([key, rawValue]) => {
    if (key.startsWith("&")) return;
    if (key.startsWith("@")) return;

    const value = normalizeValue(rawValue);
    if (value === undefined || value === null) return;

    if (spacingKeys[key]) {
      const cssKey = spacingKeys[key];
      const parsed = parseSpacingValue(value);
      if (Array.isArray(cssKey)) {
        cssKey.forEach((k) => {
          style[k] = parsed;
        });
      } else {
        style[cssKey] = parsed;
      }
      return;
    }

    if (key === "bgcolor") {
      style.backgroundColor = value;
      return;
    }

    if (key === "display" && typeof value === "object") {
      style.display = normalizeValue(value);
      return;
    }

    if (typeof value === "number" && ["borderRadius", "gap"].includes(key)) {
      style[key] = `${value * SPACING_UNIT}px`;
      return;
    }

    style[key] = value;
  });

  return style;
};

export const mergeStyles = (sx, style) => ({
  ...sxToStyle(sx),
  ...(style || {}),
});

export const defaultTheme = {
  palette: {
    mode: "dark",
    grey: {
      100: "#f5f5f5",
      200: "#eeeeee",
      900: "#212121",
    },
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    success: {
      main: "#2e7d32",
    },
    warning: {
      main: "#ed6c02",
    },
    background: {
      default: "#0F0F1A",
      paper: "#1A1A2E",
    },
  },
  breakpoints: {
    down: (size) => {
      const map = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 };
      const width = map[size] || 900;
      return `(max-width:${width - 0.05}px)`;
    },
  },
  zIndex: {
    drawer: 1200,
  },
  transitions: {
    create: (props, options) => ({ easing: options.easing, duration: options.duration }),
    easing: {
      sharp: "cubic-bezier(0.0, 0, 0.2, 1)",
    },
    duration: {
      leavingScreen: 225,
      enteringScreen: 225,
    },
  },
};
