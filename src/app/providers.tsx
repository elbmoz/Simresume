
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "@/i18n/compat/client";
import { useEffect } from "react";
import { initializeThemeColor } from "@/store/useThemeColorStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    initializeThemeColor();
  }, []);

  return (
    <HeroUIProvider locale={locale}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
        storageKey="simresume-theme"
      >
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}
