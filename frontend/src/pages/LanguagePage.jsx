import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Notice, PageHeading, Panel } from "../components/UI";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { changeAppLanguage } from "../i18n";
import { supportedLanguages } from "../i18n/resources";

const LanguagePage = () => {
  const { t, i18n } = useTranslation();
  const activeCode = i18n.resolvedLanguage?.split("-")[0] || "en";

  return (
    <div className="page">
      <PageHeading
        eyebrow={t("settings.preferences")}
        title={t("common.language")}
        description={t("settings.languageDescription")}
        action={<Link className="button button-outline" to="/settings">{t("settings.allSettings")}</Link>}
      />
      <Panel title={t("settings.availableLanguages")}>
        <div className="language-page-selector">
          <LanguageSwitcher />
        </div>
        <div className="language-options" role="group" aria-label={t("common.selectLanguage")}>
          {supportedLanguages.map(({ code, nativeName, name }) => (
            <button
              className={`language-option${activeCode === code ? " language-option-current" : ""}`}
              type="button"
              aria-pressed={activeCode === code}
              key={code}
              onClick={() => changeAppLanguage(code)}
            >
              <span className="language-radio" aria-hidden="true">{activeCode === code ? "✓" : ""}</span>
              <span className="language-copy">
                <strong lang={code}>{nativeName}</strong>
                <small>{name}</small>
              </span>
              {activeCode === code && <span className="settings-option-tag">{t("common.currentLanguage")}</span>}
            </button>
          ))}
        </div>
        <Notice type="info">
          {t("common.savePreference")} {t("common.coverageNotice")}
        </Notice>
      </Panel>
    </div>
  );
};

export default LanguagePage;
