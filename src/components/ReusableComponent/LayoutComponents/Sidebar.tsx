"use client";

//#region Imports
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/i18n/client";
import { sidebarData } from "@/lib/data";
import type { Locale, Theme } from "@/lib/preferences";
import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PreferencesToggle from "../PreferencesToggle";
//#endregion

//#region Component
const Sidebar = ({
  theme,
  locale,
}: {
  theme: Theme;
  locale: Locale;
}) => {
  const pathname = usePathname();
  const t = useT();
  const { orgId, isLoaded } = useAuth();
  const showNav = isLoaded && !!orgId;

  return (
    <div className="w-18 sm:w-28 h-screen sticky top-0 py-10 px-2 sm:px-6 border bg-background border-border flex flex-col items-center justify-start gap-10">
      <Sparkles className="w-5 h-5 text-foreground" strokeWidth={1.8} />
      <div className="w-full h-full justify-between items-center flex flex-col">
        <div className="w-full h-fit flex flex-col gap-4 items-center justify-center">
          {showNav &&
            sidebarData.map((item) => (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.link}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg p-2 ${
                        pathname.includes(item.link) ? "iconBackground" : ""
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${
                          pathname.includes(item.link) ? "" : "opacity-80"
                        }`}
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-sm">{t.sidebar[item.titleKey]}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
        </div>
        <div className="flex flex-col items-center gap-3">
          <PreferencesToggle currentTheme={theme} currentLocale={locale} />
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/home"
            afterSelectOrganizationUrl="/home"
            appearance={{ elements: { organizationSwitcherTrigger: "p-0" } }}
          />
          <UserButton />
        </div>
      </div>
    </div>
  );
};
//#endregion

export default Sidebar;
