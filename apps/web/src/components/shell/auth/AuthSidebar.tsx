"use client";

import type { Route } from "next";
import { useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, Key, Router, Server, Terminal } from "lucide-react";

import { BRAND_IMAGEURL, BRAND_TITLE, cn } from "@fulltemplate/common";

import type { WithChildren } from "~/lib/types";
import UserAccount, {
  UserAccountButton,
} from "~/components/common/UserAccount";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import useIsMobile from "~/lib/hooks/use-mobile";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
}

interface IProps extends WithChildren {
  defaultViewport: string | undefined;
}

export function AuthSidebar({ defaultViewport, children }: IProps) {
  const pathname = usePathname();
  const { open, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const relativePath = useMemo(() => {
    return `/`;
  }, []);

  const currentPath = useMemo(() => {
    return pathname.replace(`/dashboard`, "");
  }, [pathname]);

  const navMain = useMemo(() => {
    const navs: NavItem[] = [
      {
        title: "Introduction",
        url: "dashboard",
        icon: Home,
      },
      {
        title: "Connections",
        url: "dashboard/connections",
        icon: Router,
      },
      {
        title: "Api Keys",
        url: "settings/api",
        icon: Key,
      },
    ];

    return navs;
  }, []);

  const navPlatform = useMemo(() => {
    const navs: NavItem[] = [
      {
        title: "How it Works",
        url: "dashboard/how",
        icon: CircleHelp,
      },
      {
        title: "CLI",
        url: "dashboard/cli",
        icon: Terminal,
      },
      {
        title: "Server",
        url: "dashboard/server",
        icon: Server,
      },
    ];
    return navs;
  }, []);

  const isNavSelected = useCallback(
    (href: string) => {
      if (href === "") {
        return currentPath === href;
      }
      if (currentPath.startsWith(href)) {
        return true;
      }
      return false;
    },
    [currentPath],
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="h-10" asChild>
                <Link href="/dashboard">
                  <div className="flex items-center">
                    <Image
                      src={BRAND_IMAGEURL}
                      alt={BRAND_TITLE}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full p-0.5"
                      unoptimized
                    />
                    <span className="-mb-[2.5px] ml-[3px] shrink-0 text-xl font-semibold tracking-[0.175em] text-black dark:text-white">
                      Dashboard
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>App</SidebarGroupLabel>

            <SidebarMenu>
              {navMain.map((item) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isNavSelected(item.url)}
                      asChild
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <Link href={`${relativePath}${item.url}` as Route}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Docs</SidebarGroupLabel>
            <SidebarMenu>
              {navPlatform.map((item) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isNavSelected(item.url)}
                      asChild
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <Link href={`${relativePath}${item.url}` as Route}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-[hsl(var(--sidebar-background))] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
          <div className="flex w-full items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
            <div className="ml-auto flex"></div>
            {/* Account */}
            <Popover>
              <PopoverTrigger asChild>
                <UserAccountButton className="hidden sm:flex" />
              </PopoverTrigger>
              <PopoverContent className="hidden w-80 sm:flex" align="end">
                <UserAccount />
              </PopoverContent>
            </Popover>
            <Sheet>
              <SheetTrigger asChild>
                <UserAccountButton className="sm:hidden" />
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex flex-col rounded-t-lg sm:hidden"
              >
                <UserAccount className="pb-16" />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main
          className={cn(
            "bg-muted/20 flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden",
            isMobile === undefined &&
              defaultViewport === "mobile" &&
              "w-screen",
            isMobile === undefined &&
              defaultViewport === "desktop" &&
              !open &&
              "w-[calc(100vw-48px)]",
            isMobile === undefined &&
              defaultViewport === "desktop" &&
              open &&
              "w-[calc(100vw-256px)]",
            isMobile === true && "w-screen",
            isMobile === false && open && "w-[calc(100vw-256px)]",
            isMobile === false && !open && "w-[calc(100vw-48px)]",
          )}
        >
          <div className="flex h-full w-full flex-col overflow-y-auto px-4 py-4 pb-16 md:px-6 md:pb-24 lg:px-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
