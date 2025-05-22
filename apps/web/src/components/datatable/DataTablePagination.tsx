"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  isLoading: boolean;
  isError: boolean;
  dataLength: number | undefined;
  onSetItemPerPage: (pageSize: number) => void | Promise<void>;
}

function DataTablePagination<TData>({
  table,
  isLoading,
  isError,
  dataLength,
  onSetItemPerPage,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const currentPageItemsCount = table.getRowModel().rows.length;

  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground pr-2 pl-2 text-xs">
        {isLoading && (
          <div className="flex items-center">
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </>
          </div>
        )}
        {isError && (
          <div className="flex items-center">
            <>
              <TriangleAlert className="text-destructive mr-2 h-4 w-4" />
              Error
            </>
          </div>
        )}
        {dataLength !== undefined && dataLength === 0 && <>No items</>}
        {dataLength !== undefined && dataLength > 0 && (
          <>
            Viewing {pageIndex * pageSize + 1}-
            {pageIndex * pageSize + currentPageItemsCount} of {dataLength}
          </>
        )}
      </div>
      <div className="flex items-center space-x-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mr-2 h-6 px-2 text-xs">
              {pageSize}
              <ChevronDown className="text-muted-foreground ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[5, 10, 20, 50].map((pageSize) => {
              return (
                <DropdownMenuItem
                  key={pageSize}
                  onClick={() => {
                    table.setPageSize(pageSize);
                    void onSetItemPerPage(pageSize);
                  }}
                >
                  {pageSize}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.firstPage()}
          disabled={pageIndex === 0}
        >
          <ChevronsLeft className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.lastPage()}
          disabled={pageCount === 0 || pageIndex === pageCount - 1}
        >
          <ChevronsRight className="text-muted-foreground h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DataTablePagination;
