/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-misused-promises */

"use client";

import type {
  ColumnDef,
  FilterFn,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { default as Image } from "next/image";
import { useRouter } from "next/navigation";
import { LockClockOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { capitalize } from "es-toolkit/string";
import { AnimatePresence, motion } from "framer-motion";
import {
  HardHat,
  KeyRound,
  LockIcon,
  MailIcon,
  MoreHorizontal,
  RefreshCw,
  XIcon,
} from "lucide-react";
import moment from "moment";
import { useQueryState } from "nuqs";
import toast from "react-hot-toast";

import type { RouterOutputs } from "@fulltemplate/api";
import type { UserRole } from "@fulltemplate/auth/src/types";
import type { OnlineUser } from "@fulltemplate/socket";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { cn } from "@fulltemplate/common";

import type {
  GenFilter,
  GenFilterValue,
} from "~/components/common/GenericFilter";
import AdminDeleteUserAlert from "~/components/alert/admin/AdminDeleteUserAlert";
import AdminDeleteUsersAlert from "~/components/alert/admin/AdminDeleteUsersAlert";
import AdminDeleteUserSessionsAlert from "~/components/alert/admin/AdminDeleteUserSessionsAlert";
import AdminDisableTwoFactorAlert from "~/components/alert/admin/AdminDisableTwoFactorAlert";
import AdminImpersonateAlert from "~/components/alert/admin/AdminImpersonateAlert";
import AdminRemoveRequirePasswordChangeAlert from "~/components/alert/admin/AdminRemoveRequirePasswordChangeAlert";
import AdminRemoveRequireTwoFactorAlert from "~/components/alert/admin/AdminRemoveRequireTwoFactorAlert";
import AdminRequirePasswordChangeAlert from "~/components/alert/admin/AdminRequirePasswordChangeAlert";
import AdminRequireTwoFactorAlert from "~/components/alert/admin/AdminRequireTwoFactorAlert";
import AdminUnbanUserAlert from "~/components/alert/admin/AdminUnbanUserAlert";
import DateText from "~/components/common/DateText";
import {
  GenericDisplay,
  GenericDisplayButton,
} from "~/components/common/GenericDisplay";
import GenericEmpty from "~/components/common/GenericEmpty";
import GenericError from "~/components/common/GenericError";
import {
  GenericFilter,
  GenericFilterButton,
} from "~/components/common/GenericFilter";
import GenericLoading from "~/components/common/GenericLoading";
import {
  GenericMultiSelect,
  GenericMultiSelectButton,
} from "~/components/common/GenericMultiSelect";
import GenericSearch from "~/components/common/GenericSearch";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
import AdminBanUserDialog from "~/components/dialog/admin/AdminBanUserDialog";
import AdminCreateUserDialog from "~/components/dialog/admin/AdminCreateUserDialog";
import AdminEditUserDialog from "~/components/dialog/admin/AdminEditUserDialog";
import AdminEditUserPasswordDialog from "~/components/dialog/admin/AdminEditUserPasswordDialog";
import AdminVerifyPasswordDialog from "~/components/dialog/admin/AdminVerifyPasswordDialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { setActionKeyValue } from "~/lib/actions/actions";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const ITEMS_PER_PAGE_KEY = "admin-users-per-page";
const VISIBLE_COLUMNS_KEY = "admin-users-display-properties";

type User = RouterOutputs["admin"]["getUsers"][number];
type AppConfig = RouterOutputs["admin"]["getAppConfig"];

const filters: GenFilter[] = [
  {
    id: "role",
    name: "Role",
    accessorKey: "role",
  },
];

type Provider = "credentials" | "google" | "github" | "slack";

const PROVIDERS = ["credentials", "google", "github", "slack"];

export default function Client({
  initialPageSize,
  initialVisibleColumns,
  appConfig,
  userRole,
  userId,
}: {
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
  appConfig: AppConfig;
  userRole: UserRole;
  userId: string;
}) {
  const api = useTRPC();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.admin.getUsers.queryOptions(),
  );

  const mutation = useMutation(api.admin.resetPassword.mutationOptions());
  const mutation1 = useMutation(api.admin.sendVerifyEmail.mutationOptions());

  const [openEdit, setOpenEdit] = useState(false);
  const [openEditPassword, setOpenEditPassword] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openBan, setOpenBan] = useState(false);
  const [openUnban, setOpenUnban] = useState(false);
  const [openDisable2FA, setOpenDisable2FA] = useState(false);
  const [openRequire2FA, setOpenRequire2FA] = useState(false);
  const [openRemoveRequire2FA, setOpenRemoveRequire2FA] = useState(false);
  const [openRequirePasswordChange, setOpenRequirePasswordChange] =
    useState(false);
  const [openRemoveRequirePasswordChange, setOpenRemoveRequirePasswordChange] =
    useState(false);
  const [openSingleDelete, setOpenSingleDelete] = useState(false);
  const [openMultiDelete, setOpenMultiDelete] = useState(false);
  const [verifyOpen, setOpenVerify] = useState(false);
  const [openSingleKick, setOpenSingleKick] = useState(false);
  const [openImpersonateUser, setOpenImpersonateUser] = useState(false);

  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(
    PROVIDERS as Provider[],
  );

  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [preventClick, setPreventClick] = useState(false);

  const [search, setSearch] = useQueryState("search");

  const [sort, setSort] = useQueryState("sort");
  const [sortProp, desc] = sort?.split(":") ?? [];
  const [sorting, setSorting] = useState<SortingState>(
    sort !== null
      ? [
          {
            id: sortProp ?? "id",
            desc: desc === "desc",
          },
        ]
      : [
          {
            id: "Created At",
            desc: true,
          },
        ],
  );

  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<GenFilter>();
  const [appliedFilters, setAppliedFilters] = useState<GenFilterValue[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );
  const [rowSelection, setRowSelection] = useState({});

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[] | undefined>();

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

  // @ts-expect-error Types of property 'accessorFn' are incompatible.
  const columns: ColumnDef<User>[] = useMemo(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="mt-[2px]"
          />
        ),
        cell: ({ row }) => (
          <div
            className="relative flex h-full items-center"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "User",
        accessorFn: (row) => {
          return `${row.firstName} ${row.lastName}-${row.name}-${row.username}-${row.email}`;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="User" />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="flex items-center pr-1.5">
              <div className="relative shrink-0">
                <Image
                  width={32}
                  height={32}
                  className="border-border h-8 w-8 shrink-0 rounded-full border"
                  src={
                    row.original.image ??
                    `https://avatar.vercel.sh/${row.original.email}`
                  }
                  alt=""
                  unoptimized
                />
                <span
                  className={cn(
                    "border-background absolute end-0 bottom-0 size-3 rounded-full border-2",
                    onlineUsers
                      ?.map((u) => u.user?.userId)
                      .includes(row.original.id)
                      ? "bg-green-500"
                      : "bg-gray-500",
                  )}
                >
                  <span className="sr-only">Online</span>
                </span>
              </div>
              <div className="ml-2 flex flex-col justify-center">
                <div className="flex items-center">
                  <p className="text-primary flex items-center truncate font-medium">
                    {[row.original.firstName, row.original.lastName].join(" ")}
                  </p>
                  {row.original.config?.bannedAt && (
                    <Tooltip
                      title={moment(row.original.config.bannedAt).format(
                        "DD MMM YYYY, HH:mm:ss",
                      )}
                      placement="top"
                      arrow
                    >
                      <span className="ml-2 flex h-5 items-center justify-center gap-x-1.5 rounded-md bg-red-100 px-2 text-[10px] font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
                        Banned
                      </span>
                    </Tooltip>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center font-medium">
                  {row.original.email}
                </p>
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        id: "Account",
        filterFn: "multiValueFilter",
        accessorFn: (row) => {
          return row.accounts.map((a) => a.provider).join(",");
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Account"
            />
          );
        },
        cell: ({ row }) => {
          const userConfig = row.original.config;
          return (
            <div className="flex max-w-[160px] gap-x-2 truncate">
              {row.original.accounts.map((account) => {
                return (
                  <div
                    key={account.provider}
                    className="flex flex-row items-center justify-start gap-x-2"
                  >
                    <Tooltip
                      title={capitalize(account.provider)}
                      placement="top"
                      arrow
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 p-1.5"
                      >
                        {account.provider === "credentials" &&
                          !row.original.isAnonymous && (
                            <MailIcon className="text-primary h-5 w-5" />
                          )}
                        {account.provider === "credentials" &&
                          row.original.isAnonymous && (
                            <HardHat className="text-primary h-5 w-5" />
                          )}
                        {account.provider === "github" && (
                          <Image
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain"
                            src="/provider/github.svg"
                            alt="Github logo"
                          />
                        )}
                        {account.provider === "google" && (
                          <Image
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain"
                            src="/provider/google.svg"
                            alt="Google logo"
                          />
                        )}
                        {account.provider === "slack" && (
                          <Image
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain"
                            src="/provider/slack.svg"
                            alt="Slack logo"
                          />
                        )}
                      </Button>
                    </Tooltip>
                    {userConfig?.bannedAt && (
                      <Tooltip
                        title={
                          !userConfig.banExpiresAt
                            ? "Account is permanently banned"
                            : `Account is temporarily banned until: ${moment(userConfig.banExpiresAt).toISOString()}`
                        }
                        placement="top"
                        arrow
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 p-1.5"
                        >
                          {!userConfig.banExpiresAt && (
                            <LockIcon className="text-primary h-5 w-5" />
                          )}
                          {userConfig.banExpiresAt && (
                            <LockClockOutlined
                              className="text-primary h-5 w-5"
                              fontSize="small"
                            />
                          )}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>
          );
        },
        enableHiding: false,
      },
      {
        id: "Role",
        accessorKey: "role",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="Role" />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  row.original.role === "user" &&
                    "bg-blue-50 text-blue-700 ring-blue-700/10",
                  row.original.role === "admin" &&
                    "bg-red-50 text-red-700 ring-red-700/10",
                  row.original.role === "superadmin" &&
                    "bg-purple-50 text-purple-700 ring-purple-700/10",
                  row.original.role === "internal" &&
                    "bg-green-50 text-green-700 ring-green-700/10",
                )}
              >
                {capitalize(row.original.role)}
              </span>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        id: "Created At",
        accessorKey: "createdAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Created At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              <DateText date={row.original.createdAt} textType="short" />
            </div>
          );
        },
      },
      {
        id: "Actions",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Actions"
            />
          );
        },
        cell: ({ row }) => {
          const role = row.original.role as UserRole;
          const isSameUser = userId === row.original.id;
          const hasUserAccess = ensureUserHasHigherRole(userRole, role);
          return (
            <DropdownMenu
              onOpenChange={(e) => {
                setPreventClick(e);
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{userRole}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(
                      `/admin/users/${row.original.id}/events?category=auth&type=sign-in&status=failed`,
                    );
                  }}
                >
                  See Failed Login Attempts
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/admin/users/${row.original.id}/sessions`);
                  }}
                >
                  See All Sessions
                </DropdownMenuItem>
                {(hasUserAccess || isSameUser) && (
                  <>
                    {!row.original.emailVerified && (
                      <DropdownMenuItem
                        onClick={async () => {
                          await onSubmitVerifyAccount(row.original.email ?? "");
                        }}
                      >
                        Send Verify Email
                      </DropdownMenuItem>
                    )}
                    {row.original.accounts
                      .map((a) => a.provider)
                      .includes("credentials") && (
                      <>
                        <DropdownMenuItem
                          onClick={async () => {
                            await onSubmitResetPassword(
                              row.original.email ?? "",
                            );
                          }}
                        >
                          Send Reset Password Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(row.original);
                            setOpenEditPassword(true);
                          }}
                        >
                          Edit Password
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(row.original);
                        setOpenEdit(true);
                      }}
                    >
                      Edit Information
                    </DropdownMenuItem>
                    {row.original.twoFactorAuthentications.length > 0 && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(row.original);
                          setOpenDisable2FA(true);
                        }}
                      >
                        Disable Two-Factor
                      </DropdownMenuItem>
                    )}
                    {!isSameUser && hasUserAccess && (
                      <>
                        {row.original.twoFactorAuthentications.length === 0 && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(row.original);
                              if (row.original.config?.requiresTwoFactorAuth) {
                                setOpenRemoveRequire2FA(true);
                                return;
                              }
                              setOpenRequire2FA(true);
                            }}
                          >
                            {row.original.config?.requiresTwoFactorAuth
                              ? "Remove Two-Factor Requirement"
                              : "Require Two-Factor"}
                          </DropdownMenuItem>
                        )}
                        {row.original.accounts
                          .map((a) => a.provider)
                          .includes("credentials") && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(row.original);
                              if (row.original.config?.requiresPasswordChange) {
                                setOpenRemoveRequirePasswordChange(true);
                                return;
                              }
                              setOpenRequirePasswordChange(true);
                            }}
                          >
                            {row.original.config?.requiresPasswordChange
                              ? "Remove Password Change Requirement"
                              : "Require Password Change"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(row.original);
                            setOpenSingleDelete(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                        {!row.original.config?.bannedAt ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(row.original);
                              setOpenBan(true);
                            }}
                          >
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(row.original);
                              setOpenUnban(true);
                            }}
                          >
                            Unban User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(row.original);
                            setOpenSingleKick(true);
                          }}
                        >
                          Kick from all sessions
                        </DropdownMenuItem>
                        {role !== "superadmin" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(row.original);
                              setOpenImpersonateUser(true);
                            }}
                          >
                            Impersonate
                          </DropdownMenuItem>
                        )}
                        {row.original.config?.bannedAt ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setOpenUnban(true);
                              setSelectedUser(row.original);
                            }}
                          >
                            Unlock Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setOpenBan(true);
                              setSelectedUser(row.original);
                            }}
                          >
                            Lock Account
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, [userRole, userId, onlineUsers]);

  const multiValueFilter: FilterFn<any> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
      return true;
    }

    const cellValue = row.getValue<string>(columnId);

    return filterValue.some((value) => cellValue.includes(value as string));
  };

  const table = useReactTable({
    data: data ?? [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setSearch,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      multiValueFilter,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
    state: {
      sorting: sorting,
      globalFilter: search,
      columnVisibility: columnVisibility,
      rowSelection: rowSelection,
    },
    globalFilterFn: "auto",
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const currentPageItemsCount = table.getRowModel().rows.length;

  useEffect(() => {
    void setActionKeyValue(
      VISIBLE_COLUMNS_KEY,
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  useEffect(() => {
    const newSort = sorting[0]
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : null;

    void setSort((prevSort) => (prevSort !== newSort ? newSort : prevSort));
  }, [sorting]);

  useEffect(() => {
    socket.on("onlineUsersData", (data) => {
      if (appConfig.isSuperadminHidden && userRole === "admin") {
        data.users = data.users.filter(
          (user) => user.user?.role !== "superadmin",
        );
      }
      setOnlineUsers(data.users);
    });

    return () => {
      socket.off("onlineUsersData");
    };
  }, [appConfig.isSuperadminHidden, userRole]);

  useEffect(() => {
    const column = table.getColumn("Account");
    if (!column) {
      return;
    }

    if (selectedProviders.length === 0) {
      column.setFilterValue(undefined);
      return;
    }
    column.setFilterValue(selectedProviders);
  }, [selectedProviders, table]);

  return (
    <>
      {selectedUser && (
        <>
          <AdminDeleteUserAlert
            open={openSingleDelete}
            setOpen={setOpenSingleDelete}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
            onDelete={() => {
              setSelectedUser(undefined);
            }}
          />
          <AdminEditUserDialog
            open={openEdit}
            setOpen={setOpenEdit}
            user={selectedUser}
            userRole={userRole}
            appConfig={appConfig}
          />
          <AdminBanUserDialog
            open={openBan}
            setOpen={setOpenBan}
            user={selectedUser}
          />
          <AdminUnbanUserAlert
            open={openUnban}
            setOpen={setOpenUnban}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminEditUserPasswordDialog
            open={openEditPassword}
            setOpen={setOpenEditPassword}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminDeleteUserSessionsAlert
            open={openSingleKick}
            setOpen={setOpenSingleKick}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminImpersonateAlert
            open={openImpersonateUser}
            setOpen={setOpenImpersonateUser}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminDisableTwoFactorAlert
            open={openDisable2FA}
            setOpen={setOpenDisable2FA}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminRequireTwoFactorAlert
            open={openRequire2FA}
            setOpen={setOpenRequire2FA}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminRemoveRequireTwoFactorAlert
            open={openRemoveRequire2FA}
            setOpen={setOpenRemoveRequire2FA}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminRequirePasswordChangeAlert
            open={openRequirePasswordChange}
            setOpen={setOpenRequirePasswordChange}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
          <AdminRemoveRequirePasswordChangeAlert
            open={openRemoveRequirePasswordChange}
            setOpen={setOpenRemoveRequirePasswordChange}
            userId={selectedUser.id}
            email={selectedUser.email ?? ""}
          />
        </>
      )}
      {selectedUserIds.length > 0 && (
        <AdminDeleteUsersAlert
          open={openMultiDelete}
          setOpen={setOpenMultiDelete}
          userIds={selectedUserIds}
          onDelete={() => {
            setSelectedUserIds([]);
            table.resetRowSelection();
          }}
        />
      )}
      {((userRole === "admin" && appConfig.canAdminCreateUsers) ||
        userRole === "superadmin") && (
        <AdminCreateUserDialog
          open={openCreate}
          setOpen={setOpenCreate}
          userRole={userRole}
          appConfig={appConfig}
        />
      )}
      <AdminVerifyPasswordDialog
        open={verifyOpen}
        setOpen={setOpenVerify}
        onSuccess={() => {
          setOpenMultiDelete(true);
        }}
      />
      <div className="flex h-8 items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-foreground text-xl font-semibold">Users</h2>
          {onlineUsers !== undefined ? (
            <span className="ml-3 flex h-6 items-center justify-center gap-x-1.5 rounded-md bg-green-100 px-2 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
              <svg
                viewBox="0 0 6 6"
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 bg-green-100 fill-green-700",
                  onlineUsers.length > 1 && "animate-pulse",
                )}
              >
                <circle r={3} cx={3} cy={3} />
              </svg>
              {new Set(onlineUsers.map((user) => user.user?.userId)).size}{" "}
              online
            </span>
          ) : (
            <Skeleton className="ml-3 h-6 w-20 rounded-md" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {table.getFilteredSelectedRowModel().rows.length === 0 && (
            <>
              {((userRole === "admin" && appConfig.canAdminCreateUsers) ||
                userRole === "superadmin") && (
                <Button
                  variant="default"
                  onClick={() => {
                    setOpenCreate(true);
                  }}
                  className="flex h-8 flex-col items-center justify-center rounded-md"
                >
                  Create
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setOnlineUsers(undefined);
                  socket.emit("onlineUsers", {});
                  void refetch();
                }}
              >
                <RefreshCw
                  className={cn("size-4", isRefetching && "animate-spin")}
                />
              </Button>
            </>
          )}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="h-8">
                    Selected ({table.getFilteredSelectedRowModel().rows.length}/
                    {table.getFilteredRowModel().rows.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUserIds(
                        table
                          .getFilteredSelectedRowModel()
                          .rows.map((row) => row.original.id),
                      );
                      setOpenVerify(true);
                    }}
                  >
                    Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                    users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  table.toggleAllRowsSelected(false);
                }}
              >
                <XIcon className="text-muted-foreground size-4 shrink-0" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 items-center gap-2 md:flex">
        <GenericSearch
          search={search}
          setSearch={setSearch}
          className="col-span-2"
        />
        <Sheet>
          <SheetTrigger asChild>
            <GenericMultiSelectButton
              label="Providers"
              icon={KeyRound}
              selectedCount={selectedProviders.length}
              className="col-span-2 sm:hidden"
            />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex flex-col rounded-t-lg sm:hidden"
          >
            <GenericMultiSelect
              label="Provider"
              options={PROVIDERS.map((provider) => ({
                id: provider,
                label: capitalize(provider),
              }))}
              selectedOptions={selectedProviders}
              onChange={function (selected: string[]): void {
                setSelectedProviders(selected as Provider[]);
              }}
            />
          </SheetContent>
        </Sheet>
        <Popover>
          <PopoverTrigger asChild>
            <GenericMultiSelectButton
              label="Providers"
              icon={KeyRound}
              selectedCount={selectedProviders.length}
              className="col-span-2 hidden sm:flex"
            />
          </PopoverTrigger>
          <PopoverContent className="hidden w-80 sm:flex" align="end">
            <GenericMultiSelect
              label="Provider"
              options={PROVIDERS.map((provider) => ({
                id: provider,
                label: capitalize(provider),
              }))}
              selectedOptions={selectedProviders}
              onChange={function (selected: string[]): void {
                setSelectedProviders(selected as Provider[]);
              }}
            />{" "}
          </PopoverContent>
        </Popover>
        {/* Filter */}
        <Sheet
          open={open2}
          onOpenChange={(e) => {
            setOpen2(e);
            if (!e) {
              setSelectedFilter(undefined);
            }
          }}
        >
          <SheetTrigger asChild>
            <GenericFilterButton
              appliedFilters={appliedFilters}
              className="sm:hidden"
            />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex flex-col rounded-t-lg sm:hidden"
          >
            <GenericFilter
              filters={filters}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
              data={table.getFilteredRowModel().rows.map((row) => row.original)}
              onApplyFilter={(filter, value) => {
                setAppliedFilters((prevState) => {
                  return [
                    ...prevState,
                    {
                      filter: filter,
                      value: value,
                    },
                  ];
                });
                setSelectedFilter(undefined);
                setOpen2(false);

                const column = table.getColumn(filter.name)!;
                column.setFilterValue(value);
              }}
              className="pt-4 pb-16"
            />
          </SheetContent>
        </Sheet>
        <Popover
          open={open}
          onOpenChange={(e) => {
            setOpen(e);
            if (!e) {
              setSelectedFilter(undefined);
            }
          }}
        >
          <PopoverTrigger asChild>
            <GenericFilterButton
              appliedFilters={appliedFilters}
              className="hidden sm:flex"
            />
          </PopoverTrigger>
          <PopoverContent className="hidden w-64 sm:flex" align="end">
            <GenericFilter
              filters={filters}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
              data={table.getFilteredRowModel().rows.map((row) => row.original)}
              onApplyFilter={(filter, value) => {
                setAppliedFilters((prevState) => {
                  return [
                    ...prevState,
                    {
                      filter: filter,
                      value: value,
                    },
                  ];
                });
                setSelectedFilter(undefined);
                setOpen(false);

                const column = table.getColumn(filter.name)!;
                column.setFilterValue(value);
              }}
              className=""
            />
          </PopoverContent>
        </Popover>
        {/* Display */}
        <Sheet>
          <SheetTrigger asChild>
            <GenericDisplayButton table={table} className="sm:hidden" />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex flex-col rounded-t-lg sm:hidden"
          >
            <GenericDisplay table={table} className="pt-4 pb-16" />
          </SheetContent>
        </Sheet>
        <Popover>
          <PopoverTrigger asChild>
            <GenericDisplayButton table={table} className="hidden sm:flex" />
          </PopoverTrigger>
          <PopoverContent className="hidden w-80 sm:flex" align="end">
            <GenericDisplay table={table} className="" />
          </PopoverContent>
        </Popover>
      </div>
      <AnimatePresence>
        {appliedFilters.length > 0 && (
          <motion.div
            key="box"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-2 flex items-center overflow-hidden"
          >
            <div className="flex w-full flex-wrap items-center gap-2">
              {appliedFilters.map((filter) => {
                return (
                  <div
                    key={filter.filter.id}
                    className="border-border flex h-9 items-center overflow-hidden rounded-md border"
                  >
                    <div className="text-primary px-3 py-2 text-sm font-medium">
                      {filter.filter.name}
                    </div>
                    <div className="bg-border h-full w-[1px]"></div>
                    <div className="text-muted-foreground px-3 py-2 text-sm">
                      is
                    </div>
                    <div className="bg-border h-full w-[1px]"></div>
                    <div className="text-primary px-3 py-2 text-sm">
                      {filter.value}
                    </div>
                    <div className="bg-border h-full w-[1px]"></div>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-8 rounded-none p-2"
                        onClick={() => {
                          setAppliedFilters((prevState) => {
                            return prevState.filter(
                              (p) => p.filter.id !== filter.filter.id,
                            );
                          });
                          const column = table.getColumn(filter.filter.name)!;
                          column.setFilterValue(undefined);
                        }}
                      >
                        <XIcon className="text-muted-foreground h-full w-full" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              variant="ghost"
              className="text-muted-foreground shrink-0 text-sm"
              onClick={() => {
                setAppliedFilters([]);
                for (const filter of appliedFilters) {
                  const column = table.getColumn(filter.filter.name)!;
                  column.setFilterValue(undefined);
                }
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2 shrink-0 overflow-hidden rounded-md border">
        <ScrollArea>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/70">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 &&
                table.getRowModel().rows.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="h-[50px]! max-h-[50px]! cursor-pointer"
                      onClick={() => {
                        if (preventClick) {
                          return;
                        }
                        if (
                          table.getFilteredSelectedRowModel().rows.length === 0
                        ) {
                          router.push(`/admin/users/${row.original.id}`);
                        } else {
                          toast.error(
                            "Remove selections to enter user details!",
                          );
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="h-[50px]! max-h-[50px]! px-4 py-1"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center"
                    height={pageSize * 50}
                  >
                    <GenericLoading />
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center"
                    height={pageSize * 50}
                  >
                    <GenericError />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                pageIndex === pageCount - 1 &&
                (currentPageItemsCount === 0 ||
                  currentPageItemsCount % pageSize !== 0) &&
                Array.from(Array(pageSize - currentPageItemsCount).keys()).map(
                  (i) => {
                    return (
                      <TableRow key={i} className="h-[50px]! max-h-[50px]!">
                        <TableCell
                          colSpan={columns.length}
                          className="h-[50px]! max-h-[50px]! px-4 py-1"
                        ></TableCell>
                      </TableRow>
                    );
                  },
                )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center"
                    height={pageSize * 50}
                  >
                    <GenericEmpty />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <DataTablePagination
        table={table}
        isLoading={isLoading}
        isError={isError}
        dataLength={data?.length}
        onSetItemPerPage={(pageSize) => {
          void setActionKeyValue(ITEMS_PER_PAGE_KEY, pageSize.toString());
        }}
      />
    </>
  );
}
