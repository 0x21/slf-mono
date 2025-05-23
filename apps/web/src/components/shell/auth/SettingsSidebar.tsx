"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithChildren } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";

const navigation = [
  {
    name: "General",
    href: "/settings",
  },
  {
    name: "Security",
    href: "/settings/security",
  },
  {
    name: "API",
    href: "/settings/api",
  },
];

export default function SettingsSidebar({ children }: WithChildren) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const currentNavItem = useMemo(() => {
    return navigation.find((nav) => nav.href === pathname);
  }, [pathname]);

  const currentPageName = currentNavItem ? currentNavItem.name : "General";

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full items-center">
        <h1 className="text-foreground h-8 text-xl font-semibold">Settings</h1>

        <div className="mt-4 lg:hidden">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-primary flex w-full items-center justify-between p-2",
                )}
                onClick={() => setNavOpen(true)}
              >
                <>
                  <div className="ml-1.5 text-sm">{currentPageName}</div>
                  <ChevronsUpDownIcon className="text-muted-foreground ml-2 h-4 w-4" />
                </>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="bg-background mx-auto flex h-1/3 flex-col p-4"
            >
              <h2 className="text-muted-foreground my-4 text-xs">Settings</h2>
              <nav className="grid gap-2 px-2 text-sm font-medium">
                <div className="flex w-full flex-col">
                  {navigation.map((nav) => (
                    <Link
                      key={nav.name}
                      href={nav.href as Route}
                      className={cn(
                        "hover:text-foreground mx-[-0.65rem] flex items-center gap-4 rounded-md px-3 py-2",
                        pathname === nav.href &&
                          "text-primary bg-primary/10 font-semibold",
                      )}
                      onClick={() => setNavOpen(false)}
                    >
                      {nav.name}
                      {pathname === nav.href && (
                        <CheckIcon className="text-foreground ml-auto h-4 w-4" />
                      )}
                    </Link>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid w-full items-start gap-6 lg:grid-cols-[150px_1fr]">
        <nav className="text-muted-foreground hidden flex-col space-y-4 text-sm lg:flex">
          {navigation.map((nav) => (
            <Link
              key={nav.name}
              href={nav.href as Route}
              className={cn(
                pathname === nav.href && "text-primary font-semibold",
              )}
            >
              {nav.name}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
