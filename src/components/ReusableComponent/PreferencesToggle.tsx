"use client";

//#region Imports
import { setLocale, setTheme } from "@/actions/preferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale, Theme } from "@/lib/preferences";
import { Languages, Moon, Settings2, Sun } from "lucide-react";
import { useTransition } from "react";
//#endregion

//#region Component
// Dropdown con toggles de tema (dark/light) e idioma (es/en).
// Ambos persisten en cookie server-side + revalidatePath → re-render SSR.
const PreferencesToggle = ({
  currentTheme,
  currentLocale,
}: {
  currentTheme: Theme;
  currentLocale: Locale;
}) => {
  const [pending, startTransition] = useTransition();

  const onTheme = (t: Theme) => startTransition(() => setTheme(t));
  const onLocale = (l: Locale) => startTransition(() => setLocale(l));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          aria-label="preferences"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={() => onTheme("dark")}>
          <Moon className="w-4 h-4 mr-2" />
          Dark {currentTheme === "dark" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTheme("light")}>
          <Sun className="w-4 h-4 mr-2" />
          Light {currentTheme === "light" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onLocale("es")}>
          <Languages className="w-4 h-4 mr-2" />
          Español {currentLocale === "es" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLocale("en")}>
          <Languages className="w-4 h-4 mr-2" />
          English {currentLocale === "en" && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
//#endregion

export default PreferencesToggle;
