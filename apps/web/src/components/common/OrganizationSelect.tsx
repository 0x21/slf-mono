/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BuildingIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

interface IPropsButton extends WithClassName {
  organization?: {
    slug: string;
    name: string;
    image: string | null;
  };
}

export const OrganizationSelectButton = React.forwardRef<
  HTMLButtonElement,
  IPropsButton
>(({ organization, className, ...props }, ref) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("flex items-center", className)}
      {...props}
      ref={ref}
    >
      {organization ? (
        <>
          <div className="border-border h-6 w-6 rounded-full border">
            {/* @ts-ignore */}
            <Image
              width={24}
              height={24}
              className="h-full w-full rounded-full"
              src={
                organization.image ??
                `https://avatar.vercel.sh/${organization.slug}`
              }
              alt="Organization image"
              unoptimized
            />
          </div>
          <div className="ml-1.5 text-sm">{organization.name}</div>
          {/* @ts-ignore */}
          <ChevronsUpDownIcon className="text-muted-foreground ml-2 h-4 w-4" />
        </>
      ) : (
        <>
          <div className="border-border h-6 w-6 rounded-full border">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <Skeleton className="ml-1 h-5 w-24" />
        </>
      )}
    </Button>
  );
});

interface IProps extends WithClassName {
  slug: string;
  onClose?: () => void;
}

const OrganizationSelect = ({ onClose, className }: IProps) => {
  // const { data: organizationsData } = api.authOrganization.getOrganizations.useQuery();

  // const selectedOrganization = useMemo(() => {
  //   return organizationsData?.find((organization) => organization.slug === slug);
  // }, [organizationsData, slug]);

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">My organizations</div>
        {/* @ts-ignore */}
        <Link
          href="/dashboard"
          onClick={() => {
            onClose?.();
          }}
        >
          <Button
            variant="outline"
            size="sm"
            className="text-foreground h-6 text-xs md:h-8"
          >
            View All
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-y-1">
        {/* {organizationsData?.map((organization) => {
          return (
            <Link
              key={organization.slug}
              href={`/dashboard/${organization.slug}`}
              onClick={() => {
                onClose?.();
              }}
            >
              <div
                className={cn(
                  "text-foreground hover:bg-muted/60 flex items-center rounded-md px-2 py-2 text-sm",
                  organization.slug === selectedOrganization?.slug &&
                    "bg-muted hover:bg-muted",
                )}
              >
                <Image
                  width={20}
                  height={20}
                  className="mr-2 h-5 w-5 rounded-full"
                  src={
                    organization.image ??
                    `https://avatar.vercel.sh/${organization.slug}`
                  }
                  alt="Organization image"
                  unoptimized
                />
                {organization.name}
                {organization.slug === selectedOrganization?.slug && (
                  <CheckIcon className="text-foreground ml-auto h-4 w-4" />
                )}
              </div>
            </Link>
          );
        })} */}
        {/* @ts-ignore */}
        <Link
          href="/dashboard?createOrganization=true"
          onClick={() => {
            onClose?.();
          }}
        >
          <div className="text-foreground flex items-center px-2 py-2 text-sm">
            {/* @ts-ignore */}
            <BuildingIcon className="text-foreground mr-2 h-5 w-5" />
            Create new organization
          </div>
        </Link>
      </div>
    </div>
  );
};

export default OrganizationSelect;
