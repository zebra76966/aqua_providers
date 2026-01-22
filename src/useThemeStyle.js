// src/hooks/useThemeStyles.js
import { useContext } from "react";
import { ThemeContext } from "./themecontext";

export default function useThemeStyles() {
  const { isDark } = useContext(ThemeContext);

  return {
    colors: {
      background: isDark ? "#111" : "#F8F8F8",
      text: isDark ? "#fff" : "#000",
      card: isDark ? "#222" : "#fff",
      primary: "#a580e9",
    },
    isDark,
  };
}
