/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */

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
import { capitalize } from "es-toolkit/string";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, RefreshCw, XIcon } from "lucide-react";
import { useQueryState, useQueryStates } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import type {
  GenFilter,
  GenFilterValue,
} from "~/components/common/GenericFilter";
import AdminDeleteEventAlert from "~/components/alert/admin/AdminDeleteEventAlert";
import AdminDeleteEventsAlert from "~/components/alert/admin/AdminDeleteEventsAlert";
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
import GenericSearch from "~/components/common/GenericSearch";
import LocationHoverCard from "~/components/common/LocationHoverCard";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
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
import { setCookiePageSize } from "~/lib/actions/actions";
import { setGenericVisibleColumns } from "~/lib/utils/local-storage";
import { useTRPC } from "~/trpc/react";

const VISIBLE_COLUMNS_KEY = "admin-user-events-display-properties";

type Event = RouterOutputs["admin"]["getUserEvents"][number];

const filters: GenFilter[] = [
  {
    id: "category",
    name: "Category",
    accessorKey: "category",
  },
  {
    id: "type",
    name: "Type",
    accessorKey: "type",
  },
  {
    id: "action",
    name: "Action",
    accessorKey: "action",
  },
  {
    id: "status",
    name: "Status",
    accessorKey: "status",
  },
  {
    id: "error",
    name: "Error",
    accessorKey: "error",
  },
];

export default function Client({
  params,
  initialPageSize,
  initialVisibleColumns,
}: {
  params: { userId: string };
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.admin.getUserEvents.queryOptions({
      userId: params.userId,
    }),
  );

  const [selectedEvent, setSelectedEvent] = useState<Event>();
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [search, setSearch] = useQueryState("search");
  const [selectedFilters, setSelectedFilters] = useQueryStates({
    category: {
      default: null,
      parse: (value: string) => value,
    },
    type: {
      default: null,
      parse: (value: string) => value,
    },
    action: {
      default: null,
      parse: (value: string) => value,
    },
    status: {
      default: null,
      parse: (value: string) => value,
    },
  });

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

  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<GenFilter>();
  const [appliedFilters, setAppliedFilters] = useState<GenFilterValue[]>([]);

  const columns: ColumnDef<Event>[] = useMemo(() => {
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
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "Category",
        accessorKey: "category",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Category"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.category}</div>;
        },
      },
      {
        id: "Type",
        accessorKey: "type",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader table={table} column={column} title="Type" />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.type}</div>;
        },
      },
      {
        id: "Action",
        accessorKey: "action",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Action"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.action}</div>;
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
                  row.original.status === "failed" &&
                    "bg-red-50 text-red-700 ring-red-700/10",
                  row.original.status === "success" &&
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
        id: "Metadata",
        accessorFn: (row) => {
          return JSON.stringify(row.metadata);
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Metadata"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.metadata}</div>;
        },
      },
      {
        id: "Error",
        accessorKey: "error",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Error"
            />
          );
        },
        cell: ({ row }) => {
          return <div className="truncate">{row.original.error}</div>;
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
        id: "actions",
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
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedEvent(row.original);
                    setSingleDeleteOpen(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
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
    setGenericVisibleColumns(VISIBLE_COLUMNS_KEY, columnVisibility);
  }, [columnVisibility]);

  useEffect(() => {
    const newSort = sorting[0]
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : null;

    void setSort((prevSort) => (prevSort !== newSort ? newSort : prevSort));
  }, [sorting]);

  useEffect(() => {
    setSelectedFilters({
      category: null,
      type: null,
      action: null,
      status: null,
    });
    if (appliedFilters.length > 0) {
      appliedFilters.forEach((filter) => {
        setSelectedFilters((prev) => {
          return {
            ...prev,
            [filter.filter.id]: filter.value,
          };
        });
      });
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setAppliedFilters([]);
    Object.keys(selectedFilters).forEach((key) => {
      const foundFilter = filters.find((f) => f.id === key);
      if (selectedFilters[key as keyof typeof selectedFilters] && foundFilter) {
        setAppliedFilters((prevState) => {
          return [
            ...prevState,
            {
              filter: foundFilter,
              value: selectedFilters[key as keyof typeof selectedFilters]!,
            },
          ];
        });

        const column = table.getColumn(foundFilter.name)!;
        column.setFilterValue(
          selectedFilters[key as keyof typeof selectedFilters]!,
        );
      }
    });
  }, [data]);

  return (
    <>
      {selectedEvent && (
        <AdminDeleteEventAlert
          open={singleDeleteOpen}
          setOpen={setSingleDeleteOpen}
          eventId={selectedEvent.id}
        />
      )}
      {selectedEvents.length > 0 && (
        <AdminDeleteEventsAlert
          open={multiDeleteOpen}
          setOpen={setMultiDeleteOpen}
          eventIds={selectedEvents.map((event) => event.id)}
          onSuccess={() => {
            setSelectedEvents([]);
            table.resetRowSelection();
          }}
        />
      )}
      <AdminVerifyPasswordDialog
        open={verifyOpen}
        setOpen={setVerifyOpen}
        onSuccess={() => {
          setMultiDeleteOpen(true);
        }}
      />
      <div className="flex flex-1 flex-col pt-0">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex h-8 items-center justify-end gap-1">
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
                      setSelectedEvents(
                        table
                          .getFilteredSelectedRowModel()
                          .rows.map((row) => row.original),
                      );
                      setVerifyOpen(true);
                    }}
                  >
                    Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                    events
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
              {/* @ts-ignore */}
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
                data={table
                  .getFilteredRowModel()
                  .rows.map((row) => row.original)}
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
              {/* @ts-ignore */}
              <GenericFilterButton
                appliedFilters={appliedFilters}
                className="hidden sm:flex"
              />
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <GenericFilter
                filters={filters}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
                data={table
                  .getFilteredRowModel()
                  .rows.map((row) => row.original)}
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
              {/* @ts-ignore */}
              <GenericDisplayButton
                table={table}
                className="flex flex-1 sm:hidden"
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
                        {typeof filter.value === "boolean"
                          ? (filter.value as boolean)
                            ? "Yes"
                            : "No"
                          : String(filter.value)}
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
    </>
  );
}
