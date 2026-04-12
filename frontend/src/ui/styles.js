import React, { createContext, useContext, useState, useEffect } from "react";
import { defaultTheme, mergeStyles } from "./sx";

const ThemeContext = createContext();

const themes = {
  light: {
    ...defaultTheme,
    palette: {
      mode: "light",
      primary: {
        main: "#2186EB",
        light: "#4DA3F5",
        dark: "#1A6BC7",
      },
      secondary: {
        main: "#F6851B",
        light: "#F9A54B",
        dark: "#C46B15",
      },
      success: {
        main: "#4CAF50",
        light: "#81C784",
        dark: "#388E3C",
      },
      warning: {
        main: "#FF9800",
        light: "#FFB74D",
        dark: "#F57C00",
      },
      error: {
        main: "#F44336",
        light: "#E57373",
        dark: "#D32F2F",
      },
      grey: {
        50: "#FAFAFA",
        100: "#F5F5F5",
        200: "#EEEEEE",
        300: "#E0E0E0",
        400: "#BDBDBD",
        500: "#9E9E9E",
        600: "#757575",
        700: "#616161",
        800: "#424242",
        900: "#212121",
      },
      background: {
        default: "#F6F8FA",
        paper: "#FFFFFF",
      },
      text: {
        primary: "#1A1A2E",
        secondary: "#6B7280",
      },
    },
  },
  dark: {
    ...defaultTheme,
    palette: {
      mode: "dark",
      primary: {
        main: "#2186EB",
        light: "#4DA3F5",
        dark: "#1A6BC7",
      },
      secondary: {
        main: "#F6851B",
        light: "#F9A54B",
        dark: "#C46B15",
      },
      success: {
        main: "#4CAF50",
        light: "#81C784",
        dark: "#388E3C",
      },
      warning: {
        main: "#FF9800",
        light: "#FFB74D",
        dark: "#F57C00",
      },
      error: {
        main: "#F44336",
        light: "#E57373",
        dark: "#D32F2F",
      },
      grey: {
        50: "#FAFAFA",
        100: "#F5F5F5",
        200: "#EEEEEE",
        300: "#E0E0E0",
        400: "#BDBDBD",
        500: "#9E9E9E",
        600: "#757575",
        700: "#616161",
        800: "#424242",
        900: "#212121",
      },
      background: {
        default: "#0F0F1A",
        paper: "#1A1A2E",
      },
      text: {
        primary: "#FFFFFF",
        secondary: "#9CA3AF",
      },
    },
  },
};

export const createTheme = (mode = "light") => {
  return mode === "dark" ? themes.dark : themes.light;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("theme-mode");
    return saved || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = createTheme(mode);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
};

export const styled = (BaseComponent) => (styleFactory) => {
  const StyledComponent = React.forwardRef(({ sx, style, ...props }, ref) => {
    const { theme } = useThemeMode();
    const computed =
      typeof styleFactory === "function"
        ? styleFactory({ theme: theme || defaultTheme, ...props })
        : styleFactory;
    return (
      <BaseComponent
        ref={ref}
        sx={sx}
        style={mergeStyles(computed, style)}
        {...props}
      />
    );
  });
  StyledComponent.displayName = "StyledComponent";
  return StyledComponent;
};