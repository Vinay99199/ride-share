import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, supportedLanguages } from "./resources.js";

export const LANGUAGE_STORAGE_KEY = "avonex_language";
const supportedCodes = new Set(supportedLanguages.map(({ code }) => code));
const initialLanguage = (() => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return supportedCodes.has(saved) ? saved : "en";
  } catch {
    return "en";
  }
})();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: [...supportedCodes],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  initImmediate: false,
});

const setDocumentLanguage = (language) => {
  const code = language.split("-")[0];
  document.documentElement.lang = supportedCodes.has(code) ? code : "en";
};

setDocumentLanguage(i18n.language);
i18n.on("languageChanged", (language) => {
  const code = language.split("-")[0];
  setDocumentLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, supportedCodes.has(code) ? code : "en");
  } catch {
    // The active language remains usable if browser storage is disabled.
  }
});

export const changeAppLanguage = (language) => {
  if (supportedCodes.has(language)) return i18n.changeLanguage(language);
  return Promise.resolve(i18n);
};

export const getAppLocale = (language = i18n.resolvedLanguage || i18n.language) =>
  supportedLanguages.find(({ code }) => code === language.split("-")[0])?.locale || "en-IN";

export const formatDate = (value, options, language) =>
  new Intl.DateTimeFormat(getAppLocale(language), options).format(value);

export const formatNumber = (value, options, language) =>
  new Intl.NumberFormat(getAppLocale(language), options).format(value);

export const formatCurrency = (value, currency = "INR", options, language) =>
  new Intl.NumberFormat(getAppLocale(language), {
    style: "currency",
    currency,
    ...options,
  }).format(value);

export default i18n;
