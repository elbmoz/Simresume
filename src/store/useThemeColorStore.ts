import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeColor = "default" | "morandi-blue" | "morandi-green" | "morandi-pink";

interface ThemeColorState {
  themeColor: ThemeColor;
  setThemeColor: (theme: ThemeColor) => void;
}

const THEME_CLASSES: Record<ThemeColor, string> = {
  "default": "",
  "morandi-blue": "theme-morandi-blue",
  "morandi-green": "theme-morandi-green",
  "morandi-pink": "theme-morandi-pink",
};

export const useThemeColorStore = create<ThemeColorState>()(
  persist(
    (set) => ({
      themeColor: "default",
      setThemeColor: (themeColor) => {
        const root = document.documentElement;
        
        Object.values(THEME_CLASSES).forEach((cls) => {
          if (cls) root.classList.remove(cls);
        });

        const newClass = THEME_CLASSES[themeColor];
        if (newClass) {
          root.classList.add(newClass);
        }

        set({ themeColor });
      },
    }),
    {
      name: "simresume-theme-color",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function initializeThemeColor() {
  const state = useThemeColorStore.getState();
  if (state.themeColor !== "default") {
    const root = document.documentElement;
    const themeClass = THEME_CLASSES[state.themeColor];
    if (themeClass) {
      root.classList.add(themeClass);
    }
  }
}
