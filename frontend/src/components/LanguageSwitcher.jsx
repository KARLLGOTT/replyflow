import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === "uk" ? "en" : "uk";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
	window.dispatchEvent(new Event('languageChanged'));
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all duration-300"
    >
      <span className="text-sm font-semibold">
        {currentLang === "uk" ? "🇺🇦 UA" : "🇬🇧 EN"}
      </span>
    </button>
  );
}