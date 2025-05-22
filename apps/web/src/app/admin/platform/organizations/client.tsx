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
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { useQueryState } from "nuqs";
import pluralize from "pluralize";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import AdminDeleteOrganizationAlert from "~/components/alert/admin-platform/organization/AdminDeleteOrganizationAlert";
import AdminDeleteOrganizationsAlert from "~/components/alert/admin-platform/organization/AdminDeleteOrganizationsAlert";
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
import AdminCreateOrganizationDialog from "~/components/dialog/admin-platform/organization/AdminCreateOrganizationDialog";
import AdminUpdateOrganizationDialog from "~/components/dialog/admin-platform/organization/AdminUpdateOrganizationDialog";
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

const LOCAL_VISIBLE_COLUMNS_KEY = "admin-organizations-display-properties";

type Organization = RouterOutputs["adminPlatform"]["getOrganizations"][number];

export default function Client({
  initialPageSize,
  initialVisibleColumns,
}: {
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.adminPlatform.getOrganizations.queryOptions(),
  );

  const [selectedOrganizationSlug, setSelectedOrganizationSlug] =
    useState<string>();
  const [selectedOrganizationSlugs, setSelectedOrganizationSlugs] =
    useState<string[]>();
  const [search, setSearch] = useQueryState("search");

  const [openCreate, setOpenCreate] = useState(false);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);

  const [preventClick, setPreventClick] = useState(false);

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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Organization>[] = useMemo(() => {
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
        id: "Organization",
        accessorFn: (row) => {
          return `${row.name} ${row.slug} `;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Organization"
            />
          );
        },
        cell: ({ row }) => {
          const organization = row.original;
          return (
            <div className="flex items-center">
              <div className="h-9 w-9 shrink-0 rounded-full">
                <Image
                  width={36}
                  height={36}
                  className="h-full w-full rounded-full"
                  src={
                    organization.image ??
                    `https://avatar.vercel.sh/${organization.slug}`
                  }
                  alt="Organization logo"
                  unoptimized
                />
              </div>

              <div className="ml-2 flex flex-col">
                <div className="text-sm font-medium transition">
                  {organization.name}
                </div>
                <div className="text-muted-foreground flex items-center text-xs font-medium">
                  {organization.slug}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "Owner",
        accessorKey: "owner",
        accessorFn: (row) => {
          return `${row.members[0]?.user.firstName} ${row.members[0]?.user.lastName} ${row.members[0]?.user.email} `;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Owner"
            />
          );
        },
        cell: ({ row }) => {
          const owner = row.original.members[0]?.user;
          return (
            <div className="flex items-center">
              <div className="h-9 w-9 shrink-0 rounded-full">
                <Image
                  width={36}
                  height={36}
                  className="h-full w-full rounded-full"
                  src={
                    owner?.image ?? `https://avatar.vercel.sh/${owner?.email}`
                  }
                  alt="Organization logo"
                  unoptimized
                />
              </div>

              <div className="ml-2 flex flex-col">
                <div className="text-sm font-medium transition">
                  {owner?.firstName} {owner?.lastName}
                </div>
                <div className="text-muted-foreground flex items-center text-xs font-medium">
                  {owner?.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "Pending Requests",
        accessorKey: "pendingRequests",
        header: ({ table, column }) => {
          return <DataTableColumnHeader table={table} column={column} />;
        },
        cell: ({ row }) => {
          return (
            <div
              className="truncate underline decoration-dotted hover:decoration-solid"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/admin/platform/organizations/${row.original.slug}/requests`,
                );
              }}
            >
              {row.original.supportTickets.length}{" "}
              {pluralize("Request", row.original.supportTickets.length)}
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
            <DropdownMenu
              onOpenChange={(e) => {
                setPreventClick(e);
              }}
            >
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
                    setSelectedOrganizationSlug(row.original.slug);
                    setOpenUpdate(true);
                  }}
                >
                  Update Organization
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrganizationSlug(row.original.slug);
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
  }, [router]);

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
      {openCreate && (
        <AdminCreateOrganizationDialog
          open={openCreate}
          setOpen={setOpenCreate}
        />
      )}
      {selectedOrganizationSlug && singleDeleteOpen && (
        <AdminDeleteOrganizationAlert
          open={singleDeleteOpen}
          setOpen={setSingleDeleteOpen}
          slug={selectedOrganizationSlug}
        />
      )}
      {selectedOrganizationSlugs && multiDeleteOpen && (
        <AdminDeleteOrganizationsAlert
          open={multiDeleteOpen}
          setOpen={setMultiDeleteOpen}
          slugs={selectedOrganizationSlugs}
          onSuccess={() => {
            setSelectedOrganizationSlugs([]);
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
      {selectedOrganizationSlug &&
        data?.find((w) => w.slug === selectedOrganizationSlug) && (
          <AdminUpdateOrganizationDialog
            organization={
              data.find((w) => w.slug === selectedOrganizationSlug)!
            }
            open={openUpdate}
            setOpen={setOpenUpdate}
          />
        )}
      <div className="flex flex-1 flex-col gap-2 pt-0">
        <div className="flex h-8 items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">
            Organizations
          </h2>
          <div className="flex items-center gap-1">
            {table.getFilteredSelectedRowModel().rows.length === 0 && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setOpenCreate(true);
                  }}
                  className="flex h-8 flex-col items-center justify-center rounded-md"
                >
                  Create Organization
                </Button>
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
              </>
            )}
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
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOrganizationSlugs(
                          table
                            .getFilteredSelectedRowModel()
                            .rows.map((row) => row.original.slug),
                        );
                        setVerifyOpen(true);
                      }}
                    >
                      Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                      organizations
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
                        className="h-[50px]! max-h-[50px]! cursor-pointer"
                        onClick={() => {
                          if (preventClick) {
                            return;
                          }
                          if (
                            table.getFilteredSelectedRowModel().rows.length ===
                            0
                          ) {
                            router.push(
                              `/admin/platform/organizations/${row.original.slug}`,
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
