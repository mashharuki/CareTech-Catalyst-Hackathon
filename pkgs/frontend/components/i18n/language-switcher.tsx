"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

function replaceLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${nextLocale}`;
  if (locales.includes(segments[0] as Locale)) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }
  return `/${nextLocale}/${segments.join("/")}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const search = useSearchParams();
  const { locale, messages } = useI18n();

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-full border border-border bg-card/90 px-2 py-1 backdrop-blur-sm">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      {locales.map((code) => {
        const href = `${replaceLocale(pathname, code)}${search.toString() ? `?${search.toString()}` : ""}`;
        const active = code === locale;
        return (
          <Link
            key={code}
            href={href}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {code === "ja" ? messages.common.japanese : messages.common.english}
          </Link>
        );
      })}
    </div>
  );
}
