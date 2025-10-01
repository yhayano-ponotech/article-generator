"use client";

import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "dark") return "🌙";
    if (theme === "light") return "☀️";
    return "💻";
  };

  const getLabel = () => {
    if (theme === "dark") return "ダーク";
    if (theme === "light") return "ライト";
    return "システム";
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme}>
      <span className="mr-1">{getIcon()}</span>
      {getLabel()}
    </Button>
  );
}
