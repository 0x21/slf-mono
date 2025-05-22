/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BuildingIcon,
  CircleUser,
  LogOutIcon,
  MonitorSmartphone,
  MoonIcon,
  SettingsIcon,
  ShieldCheck,
  SunIcon,
  SunMoon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { handleSignOut } from "~/lib/sign-out";
import { useTRPC } from "~/trpc/react";

// import LanguageSelect, { LanguageSelectButton } from "./LanguageSelect";

export const UserAccountButton = React.forwardRef<
  HTMLButtonElement,
  WithClassName
>(({ className, ...props }, ref) => {
  const session = useSession();

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn("border-border shrink-0 rounded-full border", className)}
      {...props}
      ref={ref}
    >
      {session.status === "loading" ? (
        <CircleUser className="h-5 w-5" />
      ) : (
        <>
          {session.data ? (
            <Image
              width={40}
              height={40}
              className="h-full w-full rounded-full"
              src={
                session.data.user.image ??
                `https://avatar.vercel.sh/${session.data.user.email}`
              }
              alt="User image"
              unoptimized
            />
          ) : (
            <Image
              width={40}
              height={40}
              className="h-full w-full rounded-full"
              //TODO: Fix this
              src={`https://avatar.vercel.sh/58}`}
              alt="User image"
              unoptimized
            />
          )}
        </>
      )}
      <span className="sr-only">Toggle user menu</span>
    </Button>
  );
});

const UserAccount = ({ className }: WithClassName) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const session = useSession();

  const { theme, setTheme } = useTheme();

  const signOutUser = async () => {
    const toastId = toast.loading("Logging out...");
    try {
      await handleSignOut();
      toast.success("Successfuly logged out! Redirecting...", {
        id: toastId,
      });
      await queryClient.invalidateQueries(api.pathFilter());
      router.push("/");
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const [languageOpen, setLanguageOpen] = useState(false);

  return (
    <>
      {session.data?.user && (
        <div className={cn("flex w-full flex-col", className)}>
          <div className="flex items-center">
            <div className="border-border h-10 w-10 rounded-full border">
              {session.data.user.image ? (
                <Image
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full"
                  src={session.data.user.image}
                  alt="User image"
                  unoptimized
                />
              ) : (
                <Image
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full"
                  src={`https://avatar.vercel.sh/${session.data.user.email}`}
                  alt="User image"
                  unoptimized
                />
              )}
            </div>
            <div className="ml-2 flex flex-col">
              <div className="text-foreground text-base">
                {[session.data.user.firstName, session.data.user.lastName].join(
                  " ",
                )}
              </div>
              <div
                className="text-muted-foreground text-sm"
                aria-describedby=""
              >
                {session.data.user.email}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col">
            {(session.data.user.role === "admin" ||
              session.data.user.role === "superadmin") && (
              <Link href="/admin">
                <div className="text-muted-foreground flex h-10 items-center py-2 text-sm">
                  <ShieldCheck className="text-foreground mr-2 h-4 w-4" />
                  Admin panel
                </div>
              </Link>
            )}
            <Link href="/dashboard">
              <div className="text-muted-foreground flex h-10 items-center py-2 text-sm">
                <BuildingIcon className="text-foreground mr-2 h-4 w-4" />
                Dashboard - My organizations
              </div>
            </Link>
            <Link href="/settings">
              <div className="text-muted-foreground flex h-10 items-center py-2 text-sm">
                <SettingsIcon className="text-foreground mr-2 h-4 w-4" />
                Account settings
              </div>
            </Link>
            <div className="text-muted-foreground flex h-10 items-center py-2 text-sm">
              <SunMoon className="text-foreground mr-2 h-4 w-4" />
              Themes
              <div className="ml-auto flex items-center space-x-1">
                <div
                  className={cn(
                    "h-6 w-6 cursor-pointer rounded-full border p-1",
                    theme === "system"
                      ? "text-foreground border-border"
                      : "text-muted-foreground border-transparent",
                  )}
                >
                  <MonitorSmartphone
                    className="h-full w-full"
                    onClick={() => {
                      setTheme("system");
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "h-6 w-6 cursor-pointer rounded-full border p-1",
                    theme === "light"
                      ? "text-foreground border-border"
                      : "text-muted-foreground border-transparent",
                  )}
                >
                  <SunIcon
                    className="h-full w-full"
                    onClick={() => {
                      setTheme("light");
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "h-6 w-6 cursor-pointer rounded-full border p-1",
                    theme === "dark"
                      ? "text-foreground border-border"
                      : "text-muted-foreground border-transparent",
                  )}
                >
                  <MoonIcon
                    className="h-full w-full"
                    onClick={() => {
                      setTheme("dark");
                    }}
                  />
                </div>
              </div>
            </div>
            {/* <div className="text-muted-foreground flex h-10 items-center py-2 text-sm">
              <Languages className="text-foreground mr-2 h-4 w-4" />
              Languages
              <div className="ml-auto flex items-center">
                <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                  <PopoverTrigger asChild>
                    <LanguageSelectButton className="-ml-1.5 flex" />
                  </PopoverTrigger>
                  <PopoverContent className="flex w-40" align="end" side="top">
                    <LanguageSelect
                      onClose={() => {
                        setLanguageOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div> */}
            <div
              className="text-muted-foreground flex h-10 cursor-pointer items-center py-2 text-sm"
              onClick={async () => {
                await signOutUser();
              }}
            >
              <LogOutIcon className="text-foreground mr-2 h-4 w-4" />
              Log out
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserAccount;
