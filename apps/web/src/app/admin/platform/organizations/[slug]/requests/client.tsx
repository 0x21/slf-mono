/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */

/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { capitalize } from "es-toolkit";
import { RefreshCw, XIcon } from "lucide-react";
import { useQueryState } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import DateText from "~/components/common/DateText";
import {
  GenericDisplay,
  GenericDisplayButton,
} from "~/components/common/GenericDisplay";
import GenericEmpty from "~/components/common/GenericEmpty";
import GenericError from "~/components/common/GenericError";
import GenericLoading from "~/components/common/GenericLoading";
import GenericSearch from "~/components/common/GenericSearch";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
import AdminSupportTicketDetailDialog from "~/components/dialog/admin-platform/organization/AdminSupportTicketDetailDialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
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
import { useTRPC } from "~/trpc/react";

const VISIBLE_COLUMNS_KEY = "admin-support-ticket-display-properties";
type Ticket =
  RouterOutputs["adminPlatform"]["getOrganizationSupportTickets"][number];

export default function Client({
  params,
  initialPageSize,
  initialVisibleColumns,
}: {
  params: { slug: string };
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.adminPlatform.getOrganizationSupportTickets.queryOptions({
      slug: params.slug,
    }),
  );

  const [selectedTicket, setSelectedTicket] = useState<Ticket>();
  const [openDetail, setOpenDetail] = useState(false);

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
      : [],
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Ticket>[] = useMemo(() => {
    return [
      // {
      //   id: "select",
      //   header: ({ table }) => (
      //     <Checkbox
      //       checked={
      //         table.getIsAllPageRowsSelected() ||
      //         (table.getIsSomePageRowsSelected() && "indeterminate")
      //       }
      //       onCheckedChange={(value) =>
      //         table.toggleAllPageRowsSelected(!!value)
      //       }
      //       aria-label="Select all"
      //       className="mt-[2px]"
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <div
      //       className="relative flex h-full items-center"
      //       onClick={(e) => {
      //         e.stopPropagation();
      //       }}
      //     >
      //       <Checkbox
      //         checked={row.getIsSelected()}
      //         onCheckedChange={(value) => row.toggleSelected(!!value)}
      //         aria-label="Select row"
      //       />
      //     </div>
      //   ),
      //   enableSorting: false,
      //   enableHiding: false,
      // },
      {
        id: "ID",
        accessorKey: "id",
        header: ({ table, column }) => {
          return <DataTableColumnHeader table={table} column={column} />;
        },
        cell: ({ row }) => {
          return (
            <div className="truncate hover:underline">
              {row.original.id.slice(0, 8)}
            </div>
          );
        },
      },
      {
        id: "From By",
        accessorFn: (row) => {
          return `${row.member.user.email} ${row.member.user.firstName} ${row.member.user.lastName}`;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="From By"
            />
          );
        },
        cell: ({ row }) => {
          const user = row.original.member.user;
          return (
            <div className="truncate">
              <div className="flex items-center truncate">
                <Image
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-gray-200"
                  src={user.image ?? `https://avatar.vercel.sh/${user.email}`}
                  alt=""
                  unoptimized
                />
                <div className="ml-2 flex flex-col justify-center">
                  <p className="flex items-center font-medium text-gray-900 dark:text-white">
                    {[user.firstName, user.lastName].join(" ")}
                  </p>
                  <p className="flex items-center font-medium text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "Subject",
        accessorKey: "subject",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Subject"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.subject}</div>;
        },
      },
      {
        id: "Status",
        accessorKey: "status",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Status"
            />
          );
        },

        cell: ({ row }) => {
          return (
            <div className="truncate">
              <span
                className={cn(
                  "inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  row.original.status === "opened" &&
                    "bg-blue-50 text-blue-700 ring-blue-700/10",
                  row.original.status === "in_progress" &&
                    "bg-yellow-50 text-yellow-700 ring-yellow-700/10",
                  row.original.status === "resolved" &&
                    "bg-green-50 text-green-700 ring-green-700/10",
                )}
              >
                {capitalize(row.original.status)}
              </span>
            </div>
          );
        },
      },
      {
        id: "Message",
        accessorKey: "message",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Message"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div
              className="mr-4 flex cursor-pointer items-center hover:underline"
              onClick={() => {
                setSelectedTicket(row.original);
                setOpenDetail(true);
              }}
            >
              See Message
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
        id: "Answered At",
        accessorKey: "answeredAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Answered At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {row.original.answeredAt && (
                <DateText date={row.original.answeredAt} textType="short" />
              )}
            </div>
          );
        },
      },
      {
        id: "Answered By",
        accessorFn: (row) => {
          const user = row.answeredAdmin;
          return `${user?.email} ${user?.firstName} ${user?.lastName}`;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Answered By"
            />
          );
        },
        cell: ({ row }) => {
          const user = row.original.answeredAdmin;
          return (
            <div className="truncate">
              {user && (
                <div className="flex items-center truncate">
                  <Image
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full border border-gray-200"
                    src={user.image ?? `https://avatar.vercel.sh/${user.email}`}
                    alt=""
                    unoptimized
                  />
                  <div className="ml-2 flex flex-col justify-center">
                    <p className="flex items-center font-medium text-gray-900 dark:text-white">
                      {[user.firstName, user.lastName].join(" ")}
                    </p>
                    <p className="flex items-center font-medium text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
      // {
      //   id: "Actions",
      //   header: ({ table, column }) => {
      //     return (
      //       <DataTableColumnHeader
      //         table={table}
      //         column={column}
      //         title="Actions"
      //       />
      //     );
      //   },
      //   cell: ({ row }) => {
      //     return (
      //       <DropdownMenu
      //         onOpenChange={(e) => {
      //           setPreventClick(e);
      //         }}
      //       >
      //         <DropdownMenuTrigger asChild>
      //           <Button variant="ghost" className="h-8 w-8 p-0">
      //             <span className="sr-only">Open menu</span>
      //             <MoreHorizontal className="h-4 w-4" />
      //           </Button>
      //         </DropdownMenuTrigger>
      //       </DropdownMenu>
      //     );
      //   },
      //   enableSorting: false,
      //   enableHiding: false,
      // },
    ];
  }, [params.slug]);

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

  return (
    <>
      {selectedTicket && (
        <AdminSupportTicketDetailDialog
          open={openDetail}
          setOpen={setOpenDetail}
          slug={params.slug}
          ticket={selectedTicket}
        />
      )}

      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex h-8 items-center justify-between">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-8">
                  Selected ({table.getFilteredSelectedRowModel().rows.length}/
                  {table.getFilteredRowModel().rows.length})
                </Button>
              </DropdownMenuTrigger>
              {/* <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroups(
                        table
                          .getFilteredSelectedRowModel()
                          .rows.map((row) => row.original),
                      );
                      setVerifyOpen(true);
                    }}
                  >
                    Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                    tickets
                  </DropdownMenuItem>
                </DropdownMenuContent> */}
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
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 items-center gap-2 md:flex">
        <div className="col-span-2 flex space-x-2 md:hidden">
          <GenericSearch search={search} setSearch={setSearch} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={async () => {
              await refetch();
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
            <GenericDisplayButton
              table={table}
              className="hidden flex-1 sm:flex"
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
                      className="h-[50px]! max-h-[50px]! cursor-pointer"
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
