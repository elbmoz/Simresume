import React from "react";
import { Check } from "lucide-react";
import { useThemeColorStore, type ThemeColor } from "@/store/useThemeColorStore";
import { cn } from "@/lib/utils";

interface ThemeOption {
  value: ThemeColor;
  name: string;
  color: string;
}

const themeOptions: ThemeOption[] = [
  { value: "default", name: "默认", color: "bg-[hsl(60_5%_10%)]" },
  { value: "morandi-blue", name: "莫兰迪蓝", color: "bg-[hsl(220_30%_45%)]" },
  { value: "morandi-green", name: "莫兰迪绿", color: "bg-[hsl(158_35%_42%)]" },
  { value: "morandi-pink", name: "莫兰迪粉", color: "bg-[hsl(340_35%_55%)]" },
];

export const ThemeColorSelector = () => {
  const { themeColor, setThemeColor } = useThemeColorStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setThemeColor(option.value)}
          className={cn(
            "group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
            themeColor === option.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <div className="relative">
            <div
              className={cn(
                "w-12 h-12 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110",
                option.color
              )}
            />
            {themeColor === option.value && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              themeColor === option.value
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            {option.name}
          </span>
        </button>
      ))}
    </div>
  );
};
