"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  EllipsisVerticalIcon,
  LayoutDashboard,
  LifeBuoy,
  Network,
} from "lucide-react";

import type { GenericTabNav } from "~/components/common/GenericTabs";
import GenericTabs from "~/components/common/GenericTabs";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function LayoutUpper(props: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { children, params } = props;

  const pathname = usePathname();
  const relativePath = useMemo(() => {
    return `/admin/platform/organizations/${params.slug}`;
  }, [params.slug]);

  const currentPath = useMemo(() => {
    return pathname.replace(`/admin/platform/organizations/${params.slug}`, "");
  }, [params.slug, pathname]);

  const navigation: GenericTabNav[] = useMemo(() => {
    return [
      {
        name: "Dashboard",
        href: "",
        icon: LayoutDashboard,
      },
      {
        name: "Members",
        href: "/members",
        icon: Network,
      },
      {
        name: "Requests",
        href: "/requests",
        icon: LifeBuoy,
      },
      {
        name: "Events",
        href: "/events",
        icon: Calendar,
      },
    ];
  }, []);

  return (
    <>
      <div className="flex h-8 items-center justify-between">
        <div className="flex items-center">
          <Link href={`/admin/platform/organizations`}>
            <h2 className="text-foreground text-xl font-semibold">
              Organizations
            </h2>
          </Link>
          <ChevronRight className="text-muted-foreground ml-1.5 size-4" />
          <h2 className="text-foreground ml-1.5 hidden truncate text-xl font-medium lg:block">
            Organization {params.slug}
          </h2>
          <h2 className="text-foreground ml-1.5 block truncate text-xl font-medium lg:hidden">
            {params.slug}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0">
                <span className="sr-only">{params.slug}</span>
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {/* <DropdownMenuItem>Example</DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-2 flex flex-1 flex-col gap-4 pt-0">
        <div className="flex w-full flex-col">
          <div className="overflow-hidden">
            <GenericTabs
              navigation={navigation}
              relativePath={relativePath}
              currentPath={currentPath}
            />
            <div className="mt-4">
              <div className="flex flex-1 flex-col gap-2 pt-0">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
