import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "avonex_theme";
const THEME_OPTIONS = ["light", "dark", "system"];

const readThemePreference = () => {
  const initializedPreference =
    document.documentElement.dataset.themePreference;
  if (THEME_OPTIONS.includes(initializedPreference)) {
    return initializedPreference;
  }

  try {
    const savedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_OPTIONS.includes(savedPreference) ? savedPreference : "dark";
  } catch (error) {
    console.warn("Could not read the saved AVONEX theme preference.", error);
    return "dark";
  }
};

const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readThemePreference);
  const [systemTheme, setSystemTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const resolvedTheme =
    preference === "system" ? systemTheme : preference;

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event) =>
      setSystemTheme(event.matches ? "dark" : "light");

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateSystemTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateSystemTheme);
    }

    mediaQuery.addListener(updateSystemTheme);
    return () => mediaQuery.removeListener(updateSystemTheme);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolvedTheme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute(
      "content",
      resolvedTheme === "dark" ? "#111318" : "#f5f7fa"
    );

    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error) {
      console.warn("Could not save the AVONEX theme preference.", error);
    }
  }, [preference, resolvedTheme]);

  const setTheme = useCallback((nextPreference) => {
    if (!THEME_OPTIONS.includes(nextPreference)) {
      throw new Error(`Unsupported theme preference: ${nextPreference}`);
    }
    setPreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ theme: preference, resolvedTheme, setTheme }),
    [preference, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
};

export default ThemeProvider;
