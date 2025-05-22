/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { useQueryState } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";

import LocationHoverCard from "~/components/common/LocationHoverCard";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { setCookiePageSize } from "~/lib/actions/actions";
import { useTRPC } from "~/trpc/react";

type Attempt = RouterOutputs["authUser"]["getFailedAttempts"][number];

export default function Client({
  initialPageSize,
  initialVisibleColumns,
}: {
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const { data, isLoading, isError } = useQuery(
    api.authUser.getFailedAttempts.queryOptions(),
  );

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

  const [rowSelection, setRowSelection] = useState({});

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );

  const columns: ColumnDef<Attempt>[] = useMemo(() => {
    return [
      // {
      // 	id: "select",
      // 	header: ({ table }) => (
      // 		<Checkbox
      // 			checked={
      // 				table.getIsAllPageRowsSelected() ||
      // 				(table.getIsSomePageRowsSelected() && "indeterminate")
      // 			}
      // 			onCheckedChange={(value) =>
      // 				table.toggleAllPageRowsSelected(!!value)
      // 			}
      // 			aria-label="Select all"
      // 			className="mt-[2px]"
      // 		/>
      // 	),
      // 	cell: ({ row }) => (
      // 		<Checkbox
      // 			checked={row.getIsSelected()}
      // 			onCheckedChange={(value) => row.toggleSelected(!!value)}
      // 			aria-label="Select row"
      // 		/>
      // 	),
      // 	enableSorting: false,
      // 	enableHiding: false,
      // },
      {
        id: "ID",
        accessorKey: "id",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="Id" />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="flex truncate">{row.original.id.slice(0, 8)}</div>
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
            />
          );
        },
      },
      {
        id: "Reason",
        accessorKey: "reason",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Reason"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.error}</div>;
        },
      },
      {
        id: "Attempt At",
        accessorKey: "attemptAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Attempt At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {moment(row.original.createdAt).format("HH:mm, MMM DD, YYYY")}
            </div>
          );
        },
      },
      // {
      // 	id: "actions",
      //	header: ({ table, column }) => {
      //		return (
      //		<DataTableColumnHeader
      //			table={table}
      //			column={column}
      //			title="Actions"
      //		/>
      //		);
      //	},
      // 	cell: ({ row }) => {
      // 		return (
      // 			<DropdownMenu>
      // 				<DropdownMenuTrigger asChild>
      // 					<Button variant="ghost" className="h-8 w-8 p-0">
      // 						<span className="sr-only">Open menu</span>
      // 						<MoreHorizontal className="h-4 w-4" />
      // 					</Button>
      // 				</DropdownMenuTrigger>
      // 				<DropdownMenuContent align="end">
      // 					<DropdownMenuLabel>Actions</DropdownMenuLabel>
      // 					<DropdownMenuItem

      // 					>
      // 						Delete
      // 					</DropdownMenuItem>
      // 				</DropdownMenuContent>
      // 			</DropdownMenu>
      // 		);
      // 	},
      // 	enableSorting: false,
      // 	enableHiding: false,
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

  return (
    <>
      <div className="grid gap-4">
        <div className="flex h-8 items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">
            Failed Login Attempts
          </h2>
          {/* <div className="flex items-center gap-1">
						{table.getFilteredSelectedRowModel().rows.length > 0 && (
							<>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="default" className="h-8">
											Selected (
											{table.getFilteredSelectedRowModel().rows.length}/
											{table.getFilteredRowModel().rows.length})
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuItem>
											Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
											attempts
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
					</div> */}
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
                {table.getRowModel().rows.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => {
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
                          {/* TODO loading */}
                          Loading
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
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center"
                      height={pageSize * 50}
                    >
                      No results.
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
