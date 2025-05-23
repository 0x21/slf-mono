/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryState } from "nuqs";

import type { RouterOutputs } from "@fulltemplate/api";

import DateText from "~/components/common/DateText";
import GenericEmpty from "~/components/common/GenericEmpty";
import GenericError from "~/components/common/GenericError";
import GenericLoading from "~/components/common/GenericLoading";
import { DataTableColumnHeader } from "~/components/datatable/DataTableColumnHeader";
import DataTablePagination from "~/components/datatable/DataTablePagination";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useTRPC } from "~/trpc/react";

const ITEMS_PER_PAGE_KEY = "auth-connections-per-page";
const VISIBLE_COLUMNS_KEY = "auth-connections-visible-columns";

type Connection = RouterOutputs["authConnection"]["getConnections"][number];

export default function ConnectionList({
  initialPageSize,
  initialVisibleColumns,
}: {
  initialPageSize: number;
  initialVisibleColumns: Record<string, boolean>;
}) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(
    api.authConnection.getConnections.queryOptions(),
  );

  const [search, setSearch] = useQueryState("search");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "createdAt",
      desc: true,
    },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibleColumns,
  );

  const columns: ColumnDef<Connection>[] = useMemo(
    () => [
      {
        accessorKey: "address",
        header: ({ table, column }) => (
          <DataTableColumnHeader
            table={table}
            column={column}
            title="Address"
          />
        ),
        cell: ({ row }) => <span>{row.original.address}</span>,
      },
      {
        accessorKey: "externalPort",
        header: ({ table, column }) => (
          <DataTableColumnHeader
            table={table}
            column={column}
            title="External Port"
          />
        ),
        cell: ({ row }) => <span>{row.original.externalPort}</span>,
      },
      {
        accessorKey: "internalPort",
        header: ({ table, column }) => (
          <DataTableColumnHeader
            table={table}
            column={column}
            title="Internal Port"
          />
        ),
        cell: ({ row }) => <span>{row.original.internalPort}</span>,
      },
      {
        accessorKey: "status",
        header: ({ table, column }) => (
          <DataTableColumnHeader table={table} column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "active"
                ? "default"
                : row.original.status === "paused"
                  ? "secondary"
                  : "destructive"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "lastSeenAt",
        header: ({ table, column }) => (
          <DataTableColumnHeader
            table={table}
            column={column}
            title="Last Seen"
          />
        ),
        cell: ({ row }) => (
          <DateText date={row.original.lastSeenAt} textType="short" />
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ table, column }) => (
          <DataTableColumnHeader
            table={table}
            column={column}
            title="Created At"
          />
        ),
        cell: ({ row }) => (
          <DateText date={row.original.createdAt} textType="short" />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const currentPageItemsCount = table.getRowModel().rows.length;

  useEffect(() => {
    void queryClient.setQueryData([VISIBLE_COLUMNS_KEY], columnVisibility);
  }, [columnVisibility]);

  return (
    <div className="mt-4 rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/70">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                <GenericLoading />
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                <GenericError />
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                <GenericEmpty />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <DataTablePagination
        table={table}
        isLoading={isLoading}
        isError={isError}
        dataLength={data?.length}
        onSetItemPerPage={(pageSize) => {
          void queryClient.setQueryData(
            [ITEMS_PER_PAGE_KEY],
            pageSize.toString(),
          );
        }}
      />
    </div>
  );
}
