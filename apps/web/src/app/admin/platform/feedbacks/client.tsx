/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */

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
import { RefreshCw } from "lucide-react";
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
import AdminFeedbackDetailDialog from "~/components/dialog/admin-platform/feedback/AdminFeedbackDetailDialog";
import { Button } from "~/components/ui/button";
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
import { setCookiePageSize } from "~/lib/actions/actions";
import { setGenericVisibleColumns } from "~/lib/utils/local-storage";
import { useTRPC } from "~/trpc/react";

const LOCAL_VISIBLE_COLUMNS_KEY = "admin-feedback-display-properties";

type Feedback = RouterOutputs["adminPlatform"]["getFeedbacks"][number];

export default function Client({
  initialPageSize,
  initialVisibleColumns,
}: {
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.adminPlatform.getFeedbacks.queryOptions(),
  );

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback>();
  const [openDetail, setOpenDetail] = useState(false);

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

  const columns: ColumnDef<Feedback>[] = useMemo(() => {
    return [
      {
        id: "User",
        accessorKey: "user",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="User" />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              <div className="flex items-center truncate">
                <div className="h-8 w-8 shrink-0 rounded-full">
                  <Image
                    width={32}
                    height={32}
                    src={
                      row.original.user.image ??
                      `https://avatar.vercel.sh/${row.original.user.email}`
                    }
                    alt=""
                    className="h-full w-full rounded-full"
                    unoptimized
                  />
                </div>
                <div className="ml-2 flex flex-col justify-center">
                  <p className="flex items-center font-medium text-gray-900 dark:text-white">
                    {[
                      row.original.user.firstName,
                      row.original.user.lastName,
                    ].join(" ")}
                  </p>
                  <p className="flex items-center font-medium text-gray-500">
                    {row.original.user.email}
                  </p>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "Reason",
        accessorKey: "reason",
        header: ({ table, column }) => {
          return <DataTableColumnHeader table={table} column={column} />;
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.reason}</div>;
        },
      },
      {
        id: "Message",
        accessorKey: "message",
        header: ({ table, column }) => {
          return <DataTableColumnHeader table={table} column={column} />;
        },
        cell: ({ row }) => {
          return (
            <div
              className="mr-4 flex cursor-pointer items-center hover:underline"
              onClick={() => {
                setSelectedFeedback(row.original);
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
      // {
      //   id: "actions",
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
      //       <DropdownMenu>
      //         <DropdownMenuTrigger asChild>
      //           <Button variant="ghost" className="h-8 w-8 p-0">
      //             <span className="sr-only">Open menu</span>
      //             <MoreHorizontal className="h-4 w-4" />
      //           </Button>
      //         </DropdownMenuTrigger>
      //         <DropdownMenuContent align="end">
      //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
      //         </DropdownMenuContent>
      //       </DropdownMenu>
      //     );
      //   },
      //   enableSorting: false,
      //   enableHiding: false,
      // },
    ];
  }, []);

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
    setGenericVisibleColumns(LOCAL_VISIBLE_COLUMNS_KEY, columnVisibility);
  }, [columnVisibility]);

  useEffect(() => {
    const newSort = sorting[0]
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : null;

    void setSort((prevSort) => (prevSort !== newSort ? newSort : prevSort));
  }, [sorting]);

  return (
    <>
      {selectedFeedback && (
        <AdminFeedbackDetailDialog
          open={openDetail}
          setOpen={setOpenDetail}
          feedback={selectedFeedback}
        />
      )}
      <div className="flex flex-1 flex-col gap-2 pt-0">
        <div className="flex h-8 items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">Feedbacks</h2>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw
                className={cn(
                  "size-4 shrink-0",
                  isRefetching && "animate-spin",
                )}
              />
            </Button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 items-center gap-2 md:flex">
          <GenericSearch
            search={search}
            setSearch={setSearch}
            className="w-full"
          />
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
        <div className="grid auto-rows-min gap-4 overflow-hidden rounded-md border">
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
                  Array.from(
                    Array(pageSize - currentPageItemsCount).keys(),
                  ).map((i) => {
                    return (
                      <TableRow key={i} className="h-[50px]! max-h-[50px]!">
                        <TableCell
                          colSpan={columns.length}
                          className="h-[50px]! max-h-[50px]! px-4 py-1"
                        ></TableCell>
                      </TableRow>
                    );
                  })}
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
        <div className="pb-16">
          <DataTablePagination
            table={table}
            isLoading={isLoading}
            isError={isError}
            dataLength={data?.length}
            onSetItemPerPage={(pageSize) => {
              setCookiePageSize(pageSize);
            }}
          />
        </div>
      </div>
    </>
  );
}
