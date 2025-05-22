/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalize } from "es-toolkit";
import {
  AppWindowIcon,
  Calendar,
  ChevronRight,
  EllipsisVerticalIcon,
  RefreshCw,
  SettingsIcon,
  UserPen,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import type { UserRole } from "@fulltemplate/auth/src/types";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { cn } from "@fulltemplate/common";

import AdminDeleteUserAlert from "~/components/alert/admin/AdminDeleteUserAlert";
import AdminDeleteUserSessionsAlert from "~/components/alert/admin/AdminDeleteUserSessionsAlert";
import AdminDisableTwoFactorAlert from "~/components/alert/admin/AdminDisableTwoFactorAlert";
import AdminImpersonateAlert from "~/components/alert/admin/AdminImpersonateAlert";
import AdminRemoveRequirePasswordChangeAlert from "~/components/alert/admin/AdminRemoveRequirePasswordChangeAlert";
import AdminRemoveRequireTwoFactorAlert from "~/components/alert/admin/AdminRemoveRequireTwoFactorAlert";
import AdminRequirePasswordChangeAlert from "~/components/alert/admin/AdminRequirePasswordChangeAlert";
import AdminRequireTwoFactorAlert from "~/components/alert/admin/AdminRequireTwoFactorAlert";
import AdminUnbanUserAlert from "~/components/alert/admin/AdminUnbanUserAlert";
import GenericTabs from "~/components/common/GenericTabs";
import AdminBanUserDialog from "~/components/dialog/admin/AdminBanUserDialog";
import AdminEditUserPasswordDialog from "~/components/dialog/admin/AdminEditUserPasswordDialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useTRPC } from "~/trpc/react";

export default function LayoutUpper(props: {
  children: React.ReactNode;
  params: { userId: string };
  isUnauthorized: boolean;
}) {
  const api = useTRPC();
  const { children, params, isUnauthorized } = props;
  const session = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    api.admin.getUserDetails.queryOptions({
      userId: params.userId,
    }),
  );

  const [isRefetching, setIsRefetching] = useState(false);

  const mutation = useMutation(api.admin.resetPassword.mutationOptions());
  const mutation1 = useMutation(api.admin.sendVerifyEmail.mutationOptions());

  const pathname = usePathname();
  const relativePath = useMemo(() => {
    return `/admin/users/${params.userId}`;
  }, [params.userId]);

  const currentPath = useMemo(() => {
    return pathname.replace(`/admin/users/${params.userId}`, "");
  }, [params.userId, pathname]);

  const navigation = useMemo(() => {
    const sessionCount = data?._count.sessions;
    const accountCount = data?._count.accounts;

    const navs = [
      {
        name: "Profile",
        href: "",
        icon: UserPen,
      },
      {
        name:
          accountCount !== undefined && accountCount !== 0
            ? `Accounts (${accountCount})`
            : "Accounts",
        href: "/accounts",
        icon: Users,
      },
      {
        name:
          sessionCount !== undefined && sessionCount !== 0
            ? `Sessions (${sessionCount})`
            : "Sessions",
        href: "/sessions",
        icon: AppWindowIcon,
      },
      {
        name: "Events",
        href: "/events",
        icon: Calendar,
      },
    ];

    if (!isUnauthorized) {
      navs.push({
        name: "Settings",
        href: "/settings",
        icon: SettingsIcon,
      });
    }
    return navs;
  }, [data, isUnauthorized]);

  const [openEditPassword, setOpenEditPassword] = useState(false);
  const [openDisable2FA, setOpenDisable2FA] = useState(false);
  const [openRequire2FA, setOpenRequire2FA] = useState(false);
  const [openRemoveRequire2FA, setOpenRemoveRequire2FA] = useState(false);
  const [openRequirePasswordChange, setOpenRequirePasswordChange] =
    useState(false);
  const [openRemoveRequirePasswordChange, setOpenRemoveRequirePasswordChange] =
    useState(false);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [singleKickOpen, setSingleKickOpen] = useState(false);

  const [impersonateUserOpen, setImpersonateUserOpen] = useState(false);
  const [openBan, setOpenBan] = useState(false);
  const [openUnban, setOpenUnban] = useState(false);

  const onSubmitResetPassword = async (email: string) => {
    const toastId = toast.loading("Sending...");
    try {
      const result = await mutation.mutateAsync({
        email: email,
      });
      if (result.success) {
        toast.success("Successfully sent password reset mail!", {
          id: toastId,
        });
        // router.push("/login");
        return;
      }
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const onSubmitVerifyAccount = async (email: string) => {
    const toastId = toast.loading("Sending...");
    try {
      const result = await mutation1.mutateAsync({
        email: email,
      });
      if (result.success) {
        toast.success("Successfully sent verfiy account mail!", {
          id: toastId,
        });
        return;
      }
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  return (
    <>
      {data && (
        <>
          <AdminDeleteUserAlert
            open={singleDeleteOpen}
            setOpen={setSingleDeleteOpen}
            userId={data.id}
            email={data.email ?? ""}
            onDelete={() => {
              router.push("/admin/users");
            }}
          />
          <AdminEditUserPasswordDialog
            open={openEditPassword}
            setOpen={setOpenEditPassword}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminUnbanUserAlert
            open={openUnban}
            setOpen={setOpenUnban}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminDeleteUserSessionsAlert
            open={singleKickOpen}
            setOpen={setSingleKickOpen}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminImpersonateAlert
            open={impersonateUserOpen}
            setOpen={setImpersonateUserOpen}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminBanUserDialog open={openBan} setOpen={setOpenBan} user={data} />
          <AdminDisableTwoFactorAlert
            open={openDisable2FA}
            setOpen={setOpenDisable2FA}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminRequireTwoFactorAlert
            open={openRequire2FA}
            setOpen={setOpenRequire2FA}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminRemoveRequireTwoFactorAlert
            open={openRemoveRequire2FA}
            setOpen={setOpenRemoveRequire2FA}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminRequirePasswordChangeAlert
            open={openRequirePasswordChange}
            setOpen={setOpenRequirePasswordChange}
            userId={data.id}
            email={data.email ?? ""}
          />
          <AdminRemoveRequirePasswordChangeAlert
            open={openRemoveRequirePasswordChange}
            setOpen={setOpenRemoveRequirePasswordChange}
            userId={data.id}
            email={data.email ?? ""}
          />
        </>
      )}
      <div className="flex h-8 items-center justify-between">
        <div className="flex items-center">
          <Link href={`/admin/users`}>
            <h2 className="text-foreground text-xl font-semibold">Users</h2>
          </Link>
          <ChevronRight className="text-muted-foreground ml-1.5 size-4" />
          <h2 className="text-foreground ml-1.5 truncate text-xl font-medium">
            <span className="hidden sm:inline">User </span>
            {params.userId.slice(0, 8)}
          </h2>

          {data && (
            <span
              className={cn(
                "ml-2 inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                data.role === "user" &&
                  "bg-blue-50 text-blue-700 ring-blue-700/10",
                data.role === "admin" &&
                  "bg-red-50 text-red-700 ring-red-700/10",
                data.role === "superadmin" &&
                  "bg-purple-50 text-purple-700 ring-purple-700/10",
                data.role === "internal" &&
                  "bg-green-50 text-green-700 ring-green-700/10",
              )}
            >
              {capitalize(data.role)}
            </span>
          )}
          {isLoading && <Skeleton className="ml-2 h-6 w-16 rounded-md" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={async () => {
              setIsRefetching(true);
              await queryClient.invalidateQueries(
                api.admin.getUserDetails.pathFilter(),
              );
              setIsRefetching(false);
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLoading || !data}>
              <Button variant="outline" className="h-8 w-8 p-0">
                <span className="sr-only">{session.data?.user.role}</span>
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {data &&
              (() => {
                if (!session.data) {
                  return <></>;
                }
                const sessionRole = session.data.user.role as UserRole;
                const userRole = data.role as UserRole;
                const isSameUser = session.data.user.id === data.id;
                const hasUserAccess = ensureUserHasHigherRole(
                  sessionRole,
                  userRole,
                );
                return (
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push(
                          `/admin/users/${data.id}/events?category=auth&type=sign-in&status=failed`,
                        );
                      }}
                    >
                      See Failed Login Attempts
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push(`/admin/users/${data.id}/sessions`);
                      }}
                    >
                      See All Sessions
                    </DropdownMenuItem>
                    {(hasUserAccess || isSameUser) && (
                      <>
                        {!data.emailVerified && (
                          <DropdownMenuItem
                            onClick={async () => {
                              await onSubmitVerifyAccount(data.email ?? "");
                            }}
                          >
                            Send Verify Email
                          </DropdownMenuItem>
                        )}
                        {data.accounts
                          .map((a) => a.provider)
                          .includes("credentials") && (
                          <>
                            <DropdownMenuItem
                              onClick={async () => {
                                await onSubmitResetPassword(data.email ?? "");
                              }}
                            >
                              Send Reset Password Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setOpenEditPassword(true);
                              }}
                            >
                              Edit Password
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/admin/users/${data.id}`);
                          }}
                        >
                          Edit Information
                        </DropdownMenuItem>
                        {data.twoFactorAuthentications.length > 0 && (
                          <DropdownMenuItem
                            onClick={() => {
                              setOpenDisable2FA(true);
                            }}
                          >
                            Disable Two-Factor
                          </DropdownMenuItem>
                        )}

                        {!isSameUser && hasUserAccess && (
                          <>
                            {data.twoFactorAuthentications.length === 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (data.config?.requiresTwoFactorAuth) {
                                    setOpenRemoveRequire2FA(true);
                                    return;
                                  }
                                  setOpenRequire2FA(true);
                                }}
                              >
                                {data.config?.requiresTwoFactorAuth
                                  ? "Remove Two-Factor Requirement"
                                  : "Require Two-Factor"}
                              </DropdownMenuItem>
                            )}
                            {data.accounts
                              .map((a) => a.provider)
                              .includes("credentials") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (data.config?.requiresPasswordChange) {
                                    setOpenRemoveRequirePasswordChange(true);
                                    return;
                                  }
                                  setOpenRequirePasswordChange(true);
                                }}
                              >
                                {data.config?.requiresPasswordChange
                                  ? "Remove Password Change Requirement"
                                  : "Require Password Change"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSingleDeleteOpen(true);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                            {!data.config?.bannedAt ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenBan(true);
                                }}
                              >
                                Ban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenUnban(true);
                                }}
                              >
                                Unban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSingleKickOpen(true);
                              }}
                            >
                              Kick from all sessions
                            </DropdownMenuItem>
                            {userRole !== "superadmin" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setImpersonateUserOpen(true);
                                }}
                              >
                                Impersonate
                              </DropdownMenuItem>
                            )}
                            {data.config?.bannedAt ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenUnban(true);
                                }}
                              >
                                Unban Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenBan(true);
                                }}
                              >
                                Ban Account
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                );
              })()}
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-2 flex w-full flex-col">
        <div className="overflow-hidden">
          <GenericTabs
            navigation={navigation}
            relativePath={relativePath}
            currentPath={currentPath}
          />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </>
  );
}
