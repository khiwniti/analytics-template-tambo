import { useState, createContext, useContext } from "react";
import { translations } from "./i18n";
import type { Lang, Translations } from "./i18n";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("portfolio-lang");
      if (stored === "th" || stored === "en") return stored as Lang;
    } catch { /* ignore */ }
    if (typeof navigator !== "undefined" && navigator.language.startsWith("th")) return "th";
    return "en";
  });

  const setLang = (l: Lang) => {
    try { localStorage.setItem("portfolio-lang", l); } catch { /* ignore */ }
    setLangState(l);
  };

  return [lang, setLang];
}

export const LangCtx = createContext<{ t: Translations; lang: Lang; setLang: (l: Lang) => void }>({
  t: translations.en,
  lang: "en",
  setLang: () => {},
});

export function useLangCtx() {
  return useContext(LangCtx);
}
