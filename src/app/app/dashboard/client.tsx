import { useState } from "react";
import { IconResumes, IconTemplates, IconSettings, IconAI, IconSmartScore } from "@/components/shared/icons/SidebarIcons";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

import { useLocale, useTranslations } from "@/i18n/compat/client";

interface MenuItem {
  title: string;
  url?: string;
  href?: string;
  icon: any;
  items?: { title: string; href: string }[];
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("dashboard");
  const sidebarItems: MenuItem[] = [
    {
      title: t("sidebar.resumes"),
      url: "/app/dashboard/resumes",
      icon: IconResumes,
    },
    {
      title: t("sidebar.templates"),
      url: "/app/dashboard/templates",
      icon: IconTemplates,
    },
    {
      title: t("sidebar.smartScore") || "智能评分",
      url: "/app/dashboard/smart-score",
      icon: IconSmartScore,
    },
    {
      title: t("sidebar.ai"),
      url: "/app/dashboard/ai",
      icon: IconAI,
    },
    {
      title: t("sidebar.settings"),
      url: "/app/dashboard/settings",
      icon: IconSettings,
    },

  ];

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">(
    "icon"
  );

  const handleItemClick = (item: MenuItem) => {
    if (item.items) {

    } else {
      router.push(item.url || item.href || "/");
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.items) {
      return item.items.some((subItem) => pathname === subItem.href);
    }
    return item.url === pathname || item.href === pathname;
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar
          collapsible={collapsible}
          className="border-r border-border/30 bg-gradient-to-b from-[#D8DBDF] to-[#CCD0D5] dark:from-zinc-800 dark:to-zinc-700"
        >
          <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/20">
            <div className="w-full cursor-pointer justify-center flex items-center" onClick={() => router.push(`/${locale}`)}
            >
              {open && (
                <span className="font-bold text-lg tracking-tight">
                  Simresume
                </span>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {sidebarItems.map((item) => {
                    const active = isItemActive(item);
                    const iconColors = [
                      "from-[#8FA4B8] to-[#7A92A8]",
                      "from-[#A89BBB] to-[#9685AD]",
                      "from-[#9DB5AA] to-[#88A396]",
                      "from-[#C4A98F] to-[#B89D82]",
                      "from-[#9E9E9E] to-[#888888]",
                    ];
                    const colorIndex = sidebarItems.indexOf(item) % iconColors.length;
                    return (
                      <TooltipProvider delayDuration={0} key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                className={`w-full transition-all duration-200 ease-in-out h-14 rounded-2xl mb-1 ${active
                                  ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm"
                                  : "hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/30"
                                  }`}
                              >
                                <div
                                  className="flex items-center gap-3 px-3 cursor-pointer"
                                  onClick={() => handleItemClick(item)}
                                >
                                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${iconColors[colorIndex]}/40 flex items-center justify-center`}>
                                    <item.icon
                                      size={20}
                                      active={active}
                                      className="text-foreground/70"
                                    />
                                  </div>
                                  {open && (
                                    <span className={`flex-1 text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
                                      {item.title}
                                    </span>
                                  )}
                                  {open && active && (
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  )}
                                </div>
                              </SidebarMenuButton>
                              {item.items && open && (
                                <div className="ml-6 mt-2 space-y-1.5 pl-2">
                                  {item.items.map((subItem) => (
                                    <div
                                      key={subItem.href}
                                      className={`cursor-pointer px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${pathname === subItem.href
                                        ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-medium shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        }`}
                                      onClick={() => router.push(subItem.href)}
                                    >
                                      {subItem.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </SidebarMenuItem>
                          </TooltipTrigger>
                          {!open && (
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
