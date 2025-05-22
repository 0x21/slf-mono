/* eslint-disable react-compiler/react-compiler */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
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
import { capitalize } from "es-toolkit/string";
import { MoreHorizontal, RefreshCw, XIcon } from "lucide-react";
import moment from "moment";
import { useQueryState } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import AdminDeleteOrganizationMemberAlert from "~/components/alert/admin-platform/organization/AdminDeleteOrganizationMemberAlert";
import AdminDeleteOrganizationMembersAlert from "~/components/alert/admin-platform/organization/AdminDeleteOrganizationMembersAlert";
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
import AdminAddNewMemberToOrganizationDialog from "~/components/dialog/admin-platform/organization/AdminAddNewMemberToOrganizationDialog";
import AdminVerifyPasswordDialog from "~/components/dialog/admin/AdminVerifyPasswordDialog";
import { Button } from "~/components/ui/button";
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
import { useTRPC } from "~/trpc/react";

const VISIBLE_COLUMNS_KEY = "rules-display-properties";

type OrganizationMember =
  RouterOutputs["adminPlatform"]["getOrganizationMembers"][number];
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
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    api.adminPlatform.getOrganizationMembers.queryOptions({
      slug: params.slug,
    }),
  );

  const [selectedMember, setSelectedMember] = useState<
    OrganizationMember | undefined
  >();
  const [selectedMembers, setSelectedMembers] = useState<OrganizationMember[]>(
    [],
  );

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [newMemberOpen, setNewMemberOpen] = useState(false);

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

  const columns: ColumnDef<OrganizationMember>[] = useMemo(() => {
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
        id: "Member",
        accessorFn: (row) => {
          return `${row.user.firstName} ${row.user.lastName} ${row.user.email} `;
        },
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              className="px-2"
              table={table}
              column={column}
              title="Member"
            />
          );
        },
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="truncate">
              <div className="flex items-center">
                <div className="h-9 w-9 shrink-0 rounded-full">
                  <Image
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full"
                    src={user.image ?? `https://avatar.vercel.sh/${user.email}`}
                    alt="Organization logo"
                    unoptimized
                  />
                </div>
                <div className="ml-2 flex flex-col">
                  <div className="text-sm font-medium transition">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-muted-foreground flex items-center text-xs font-medium">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          );
        },
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
            <div className="truncate">{capitalize(row.original.role)}</div>
          );
        },
      },
      {
        id: "Joined At",
        accessorKey: "createdAt",
        header: ({ table, column }) => {
          return (
            <DataTableColumnHeader
              table={table}
              column={column}
              title="Joined At"
            />
          );
        },
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {moment(row.original.createdAt).format("MMM DD, YYYY")}
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
            <>
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
                      setSelectedMember(row.original);
                      setSingleDeleteOpen(true);
                    }}
                  >
                    Kick from organization
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
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
    setActionKeyValue(VISIBLE_COLUMNS_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(() => {
    const newSort = sorting[0]
      ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
      : null;

    void setSort((prevSort) => (prevSort !== newSort ? newSort : prevSort));
  }, [sorting]);

  return (
    <>
      {selectedMember && (
        <AdminDeleteOrganizationMemberAlert
          open={singleDeleteOpen}
          setOpen={setSingleDeleteOpen}
          slug={params.slug}
          memberId={selectedMember.id}
          name={`${selectedMember.user.firstName} ${selectedMember.user.lastName}`}
        />
      )}
      {selectedMembers.length > 0 && (
        <AdminDeleteOrganizationMembersAlert
          open={multiDeleteOpen}
          setOpen={setMultiDeleteOpen}
          slug={params.slug}
          memberIds={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original.id)}
          onSuccess={() => {
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
      {data && (
        <AdminAddNewMemberToOrganizationDialog
          open={newMemberOpen}
          setOpen={setNewMemberOpen}
          slug={params.slug}
          existingUserIds={data.map((m) => m.user.id)}
        />
      )}
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <div className="flex h-8 items-center justify-end">
          <div className="flex items-center gap-1">
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
                      setSelectedMembers(
                        table
                          .getFilteredSelectedRowModel()
                          .rows.map((row) => row.original),
                      );
                      setVerifyOpen(true);
                    }}
                  >
                    Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                    members
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
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button
            variant="default"
            className="h-8 w-fit"
            disabled={isLoading || !data}
            onClick={() => {
              setNewMemberOpen(true);
            }}
          >
            Add New Member
          </Button>
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
    </>
  );
}
