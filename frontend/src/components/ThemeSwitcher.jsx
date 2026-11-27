import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const OPTIONS = [
  { value: "light", labelKey: "common.themeLight" },
  { value: "dark", labelKey: "common.themeDark" },
  { value: "system", labelKey: "common.themeSystem" },
];

const ThemeIcon = ({ theme }) => {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
};

const ThemeSwitcher = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!compact || !open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [compact, open]);

  if (compact) {
    return (
      <div className="theme-switcher theme-switcher-compact" ref={wrapperRef}>
        <button
          className="theme-switcher-trigger"
          type="button"
          aria-label={t("common.themePreference")}
          aria-haspopup="true"
          aria-expanded={open}
          title={t("common.themePreference")}
          onClick={() => setOpen((current) => !current)}
        >
          <ThemeIcon theme={theme} />
          <span className="theme-switcher-chevron" aria-hidden="true">⌄</span>
        </button>
        {open && (
          <div
            className="theme-switcher-menu"
            role="group"
            aria-label={t("common.themePreference")}
          >
            {OPTIONS.map((option) => (
              <button
                className="theme-switcher-menu-option"
                key={option.value}
                type="button"
                aria-pressed={theme === option.value}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
              >
                <ThemeIcon theme={option.value} />
                <span>{t(option.labelKey)}</span>
                {theme === option.value && (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m4 10 4 4 8-8" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="theme-switcher theme-switcher-segmented" role="group" aria-label={t("common.themePreference")}>
      {OPTIONS.map((option) => (
        <button
          className="theme-switcher-option"
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          <ThemeIcon theme={option.value} />
          <span>{t(option.labelKey)}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
