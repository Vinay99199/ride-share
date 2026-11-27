import assert from "node:assert/strict";
import test from "node:test";
import i18next from "i18next";
import { resources, supportedLanguages } from "../src/i18n/resources.js";

const categories = [
  "common",
  "auth",
  "settings",
  "passenger",
  "driver",
  "organization",
  "admin",
  "forms",
  "errors",
  "notifications",
];

test("all supported locales keep the same resource categories and core labels", () => {
  for (const { code } of supportedLanguages) {
    assert.deepEqual(
      Object.keys(resources[code].translation).sort(),
      [...categories].sort(),
      `${code} resource categories`
    );
    for (const path of [
      ["common", "language"],
      ["common", "selectLanguage"],
      ["common", "themePreference"],
      ["common", "ui", "footer", "ctaTitle"],
      ["common", "ui", "footer", "organizationContact"],
      ["common", "ui", "actions", "search"],
      ["common", "ui", "options", "allStatuses"],
      ["auth", "signIn"],
      ["passenger", "pages", "dashboard"],
      ["driver", "pages", "bookingRequests"],
      ["organization", "pages", "dashboard"],
      ["admin", "pages", "reviewCenter"],
      ["notifications", "actions", "markAllRead"],
      ["settings", "languageDescription"],
      ["forms", "labels", "emailAddress"],
    ]) {
      const value = path.reduce((resource, key) => resource?.[key], resources[code].translation);
      assert.ok(value, `${code} is missing ${path.join(".")}`);
    }
  }
});

test("missing localized phrases fall back to English", async () => {
  const instance = i18next.createInstance();
  await instance.init({
    resources,
    lng: "hi",
    fallbackLng: "en",
    initImmediate: false,
  });

  assert.equal(instance.t("forms.required"), resources.en.translation.forms.required);
  assert.equal(
    instance.t("common.ui.footer.ctaTitle"),
    resources.hi.translation.common.ui.footer.ctaTitle
  );
  assert.equal(
    instance.t("common.ui.nonexistentLabel"),
    "common.ui.nonexistentLabel"
  );
});

test("language changes persist, update document language, and select Intl locale", async () => {
  const saved = new Map();
  globalThis.document = { documentElement: { lang: "en" } };
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, value),
  };

  const appI18n = await import("../src/i18n/index.js");
  await appI18n.changeAppLanguage("ta");

  assert.equal(document.documentElement.lang, "ta");
  assert.equal(localStorage.getItem("avonex_language"), "ta");
  assert.equal(appI18n.getAppLocale(), "ta-IN");
  assert.ok(appI18n.formatDate(new Date("2026-03-04T15:00:00Z"), { dateStyle: "medium" }));
  assert.ok(appI18n.formatNumber(123456.78));
  assert.ok(appI18n.formatCurrency(1234.5));
});
