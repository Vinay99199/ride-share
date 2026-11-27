import { Link } from "react-router-dom";
import { PageHeading, Panel } from "../components/UI";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTranslation } from "react-i18next";

const settings = [
  {
    title: "Security",
    items: [
      {
        to: "/settings/password",
        mark: "PW",
        title: "Change password",
        description: "Update your password with current-password verification.",
      },
    ],
  },
  {
    title: "Preferences and information",
    items: [
      {
        to: "/settings/language",
        mark: "EN",
        title: "Language",
        description: "",
      },
      {
        to: "/privacy",
        mark: "PR",
        title: "Privacy policy",
        description: "Read the current privacy-practices draft.",
        tag: "Draft",
      },
      {
        to: "/referrals",
        mark: "RF",
        title: "Refer & earn",
        description: "Referral codes and rewards are not available yet.",
        tag: "Unavailable",
      },
      {
        to: "/about",
        mark: "AV",
        title: "About AVONEX",
        description: "Learn about the community carpooling platform.",
      },
    ],
  },
  {
    title: "Help and account",
    items: [
      {
        to: "/contact",
        mark: "CT",
        title: "Contact us",
        description: "Check available support channels.",
        tag: "No channel configured",
      },
      {
        to: "/help",
        mark: "HP",
        title: "Help & support",
        description: "Guides and answers for passengers and drivers.",
      },
      {
        to: "/delete-account",
        mark: "DA",
        title: "Delete account",
        description: "Review account deletion availability and requirements.",
        tag: "Unavailable",
      },
    ],
  },
];

const SettingsOption = ({ item }) => {
  const { t } = useTranslation();
  const description = item.to === "/settings/language"
    ? t("settings.languageDescription")
    : item.description;

  return (
    <Link className="settings-option" to={item.to}>
      <span className="settings-option-mark" aria-hidden="true">{item.mark}</span>
      <span className="settings-option-copy">
        <strong>{item.title}</strong>
        <small>{description}</small>
      </span>
      {item.tag && <span className="settings-option-tag">{item.tag}</span>}
      <span className="settings-option-arrow" aria-hidden="true">→</span>
    </Link>
  );
};

const SettingsPage = () => {
  const { t } = useTranslation();
  return (
  <div className="page settings-page">
    <PageHeading
      eyebrow={t("settings.account")}
      title={t("settings.settingsTitle")}
      description={t("settings.settingsDescription")}
    />
    {settings.map((group) => (
      <Panel className="settings-group" title={group.title} key={group.title}>
        <div className="settings-options">
          {group.items.map((item) => <SettingsOption key={item.to} item={item} />)}
        </div>
      </Panel>
    ))}
    <Panel title={t("settings.theme")} className="settings-appearance">
      <div className="settings-appearance-row">
        <div className="settings-appearance-copy">
          <strong>Choose your theme</strong>
          <p>Use Light or Dark mode, or follow your device preference.</p>
        </div>
        <ThemeSwitcher />
      </div>
    </Panel>
  </div>
  );
};

export default SettingsPage;
