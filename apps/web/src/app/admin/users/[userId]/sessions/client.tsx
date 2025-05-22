/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */

"use client";

import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, RefreshCw, XIcon } from "lucide-react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";
import type { UserRole } from "@fulltemplate/auth/src/types";
import type { OnlineUser } from "@fulltemplate/socket";
import { ensureUserHasHigherRole } from "@fulltemplate/auth/src/client";
import { cn } from "@fulltemplate/common";

import AdminDeleteSessionAlert from "~/components/alert/admin/AdminDeleteSessionAlert";
import AdminDeleteSessionsAlert from "~/components/alert/admin/AdminDeleteSessionsAlert";
import DateText from "~/components/common/DateText";
import {
  GenericDisplay,
  GenericDisplayButton,
} from "~/components/common/GenericDisplay";
import GenericEmpty from "~/components/common/GenericEmpty";
import GenericError from "~/components/common/GenericError";
import GenericLoading from "~/components/common/GenericLoading";
import GenericSearch from "~/components/common/GenericSearch";
import LocationHoverCard from "~/components/common/LocationHoverCard";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
import AdminNavigateDialog from "~/components/dialog/admin/AdminNavigateDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { setActionKeyValue, setCookiePageSize } from "~/lib/actions/actions";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const VISIBLE_COLUMNS_KEY = "admin-user-sessions-display-properties";

type Session = RouterOutputs["admin"]["getUserSessions"][number];

export default function Client({
  params,
  initialPageSize,
  initialVisibleColumns,
}: {
  params: {
    userId: string;
    userRole: UserRole | undefined;
  };
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const session = useSession();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.admin.getUserSessions.queryOptions({
      userId: params.userId,
    }),
  );

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[] | undefined>();
  const [search, setSearch] = useQueryState("search");

  const [selectedSession, setSelectedSession] = useState<Session>();
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);

  const [manageTabsOpen, setManageTabsOpen] = useState(false);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

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
            id: "Updated At",
            desc: true,
          },
        ],
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Session>[] = useMemo(() => {
    return [
      {
        id: "select",
        header: ({ table }) => {
          return (
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
          );
        },
        cell: ({ row }) => {
          return (
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
              {onlineUsers !== undefined && (
                <div
                  className={cn(
                    "absolute top-[-4px] bottom-0 left-0 -ml-[16px] h-[50px] w-[2px]",
                    onlineUsers
                      .map((u) => u.user?.sessionId)
                      .includes(row.original.id)
                      ? "bg-green-500"
                      : "bg-gray-500",
                  )}
                ></div>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "Id",
        accessorKey: "id",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="Id" />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="flex truncate">
              {row.original.id.slice(0, 8)}
              <span
                className={cn(
                  "ml-2 flex h-6 items-center justify-center gap-x-1.5 rounded-md px-2 text-xs font-medium",
                  session.data?.user.id === params.userId &&
                    row.original.id === session.data.id &&
                    "bg-green-100 text-green-700 ring-1 ring-green-600/20 ring-inset",
                )}
              >
                {session.data?.user.id === params.userId &&
                row.original.id === session.data.id
                  ? "Current"
                  : null}
              </span>
            </div>
          );
        },
      },
      {
        id: "Session",
        accessorKey: "session",
        header: ({ table, column }) => {
          return <DataTableColumnHeader table={table} column={column} />;
        },
        cell: ({ row }) => {
          return (
            <LocationHoverCard
              ip={row.original.ip}
              city={row.original.city}
              country={row.original.country}
              region={row.original.region}
              continent={row.original.continent}
              latitude={row.original.latitude}
              longitude={row.original.longitude}
              postalCode={row.original.postalCode}
              regionCode={row.original.regionCode}
              userAgent={row.original.userAgent}
              environment={row.original.environment}
              impersonate={row.original.impersonatedById !== null}
            />
          );
        },
      },
      {
        id: "Updated At",
        accessorKey: "updatedAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Updated At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              <DateText date={row.original.updatedAt} textType="short" />
            </div>
          );
        },
      },
      {
        id: "Expires At",
        accessorKey: "expiresAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Expires At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {moment(row.original.expires).format("MMM DD, YYYY")}
            </div>
          );
        },
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
          const isUserOnline = onlineUsers?.some(
            (u) => u.user?.sessionId === row.original.id,
          );

          const userRole = session.data?.user.role;
          const isSameUser = session.data?.user.id === params.userId;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {isUserOnline &&
                  (isSameUser ||
                    (userRole &&
                      params.userRole &&
                      ensureUserHasHigherRole(userRole, params.userRole))) && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSession(row.original);
                        setManageTabsOpen(true);
                      }}
                    >
                      Manage
                    </DropdownMenuItem>
                  )}
                {(isSameUser ||
                  (userRole &&
                    params.userRole &&
                    ensureUserHasHigherRole(userRole, params.userRole))) && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSession(row.original);
                      setSingleDeleteOpen(true);
                    }}
                  >
                    Kick
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, [params.userId, session.data, onlineUsers, params.userRole]);

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
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
    state: {
      sorting: sorting,
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
    setActionKeyValue(VISIBLE_COLUMNS_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(() => {
    const newSort = sorting[0]
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : null;

    void setSort((prevSort) => (prevSort !== newSort ? newSort : prevSort));
  }, [sorting]);

  useEffect(() => {
    socket.on("onlineUsersData", (data) => {
      setOnlineUsers(data.users);
    });

    return () => {
      socket.off("onlineUsersData");
    };
  }, []);

  return (
    <>
      {selectedSession && (
        <AdminDeleteSessionAlert
          open={singleDeleteOpen}
          setOpen={setSingleDeleteOpen}
          sessionId={selectedSession.id}
        />
      )}
      {selectedSessions.length > 0 && (
        <AdminDeleteSessionsAlert
          open={multiDeleteOpen}
          setOpen={setMultiDeleteOpen}
          sessionIds={selectedSessions.map((session) => session.id)}
        />
      )}
      <AdminVerifyPasswordDialog
        open={verifyOpen}
        setOpen={setVerifyOpen}
        onSuccess={() => {
          setMultiDeleteOpen(true);
        }}
      />
      {onlineUsers && selectedSession && (
        <AdminNavigateDialog
          open={manageTabsOpen}
          setOpen={setManageTabsOpen}
          onlineTabs={onlineUsers.filter(
            (u) => u.user?.sessionId === selectedSession.id,
          )}
        />
      )}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1">
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
                      setSelectedSessions(
                        table
                          .getFilteredSelectedRowModel()
                          .rows.map((row) => row.original),
                      );
                      setVerifyOpen(true);
                    }}
                  >
                    Kick from {table.getFilteredSelectedRowModel().rows.length}{" "}
                    sessions
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
      <div className="mt-2 grid grid-cols-2 items-center gap-2 md:flex">
        <div className="col-span-2 flex space-x-2 md:hidden">
          <GenericSearch search={search} setSearch={setSearch} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={async () => {
              await refetch();
              socket.emit("onlineUsers", {});
              setOnlineUsers(undefined);
            }}
          >
            <RefreshCw
              className={cn("flex size-4", isRefetching && "animate-spin")}
            />
          </Button>
        </div>
        <GenericSearch
          search={search}
          setSearch={setSearch}
          className="col-span-2 hidden md:flex"
        />

        {/* Display */}
        <Sheet>
          <SheetTrigger asChild>
            {/* @ts-ignore */}
            <GenericDisplayButton
              table={table}
              className="col-span-2 flex sm:hidden"
            />
          </SheetTrigger>
          <SheetContent side="bottom" className="flex flex-col rounded-t-lg">
            <GenericDisplay table={table} className="pt-4 pb-16" />
          </SheetContent>
        </Sheet>
        <Popover>
          <PopoverTrigger asChild>
            {/* @ts-ignore */}
            <GenericDisplayButton
              table={table}
              className="col-span-2 hidden flex-1 sm:flex"
            />
          </PopoverTrigger>
          <PopoverContent className="hidden w-80 sm:flex" align="end">
            <GenericDisplay table={table} className="" />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          className="hidden h-9 w-9 shrink-0 md:flex"
          onClick={async () => {
            await refetch();
            socket.emit("onlineUsers", {});
            setOnlineUsers(undefined);
          }}
        >
          <RefreshCw
            className={cn("flex size-4", isRefetching && "animate-spin")}
          />
        </Button>
      </div>
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
                      className="h-[50px]! max-h-[50px]!"
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
          setCookiePageSize(pageSize);
        }}
      />
    </>
  );
}
