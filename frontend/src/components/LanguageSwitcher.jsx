import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../i18n";
import { supportedLanguages } from "../i18n/resources";

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n, t } = useTranslation();
  const activeCode = i18n.resolvedLanguage?.split("-")[0] || "en";

  return (
    <label className={`language-switcher${compact ? " language-switcher-compact" : ""}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <span className="language-switcher-label">{t("common.language")}</span>
      <select
        aria-label={t("common.selectLanguage")}
        value={activeCode}
        onChange={(event) => changeAppLanguage(event.target.value)}
      >
        {supportedLanguages.map(({ code, nativeName }) => (
          <option value={code} key={code}>{nativeName}</option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
