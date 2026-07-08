"use client";

/**
 * lib/language-context.tsx
 * Language context — currently English only.
 * The t() function returns the key as a fallback (pages use inline fallbacks anyway).
 */

import { createContext, useContext } from "react";

type LanguageContextType = {
  lang: "en";
  // Translation helper — returns empty string so inline fallbacks like
  // t("key") || "Default text" always show the fallback English text.
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: () => "",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // t() returns "" so all `t("key") || "Fallback"` expressions use the fallback
  const t = (_key: string): string => "";

  return (
    <LanguageContext.Provider value={{ lang: "en", t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
