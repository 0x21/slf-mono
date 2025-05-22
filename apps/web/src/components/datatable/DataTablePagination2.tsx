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
  isFetching: boolean;
  isError: boolean;
  dataLength: number | undefined;
  onFirst: () => void | Promise<void>;
  onPrevious: () => void | Promise<void>;
  onNext: () => void | Promise<void>;
  onLast: () => void | Promise<void>;
  onSetItemPerPage: (pageSize: number) => void | Promise<void>;
}

function DataTablePagination2<TData>({
  table,
  isFetching,
  isError,
  dataLength,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onSetItemPerPage,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  // const currentPageItemsCount = table.getRowModel().rows.length;
  const pageCount = Math.ceil((dataLength ?? 0) / pageSize) - 1;

  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground pr-2 pl-2 text-xs">
        {isFetching && (
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
        {!isFetching && dataLength !== undefined && dataLength === 0 && (
          <>No items</>
        )}
        {!isFetching && dataLength !== undefined && dataLength > 0 && (
          <>
            Viewing {pageIndex * pageSize + 1}-{pageIndex * pageSize + pageSize}{" "}
            of {dataLength}
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
          onClick={() => {
            void onFirst();
          }}
          disabled={pageIndex === 0 || isFetching}
        >
          <ChevronsLeft className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            void onPrevious();
          }}
          disabled={pageIndex === 0 || isFetching}
        >
          <ChevronLeft className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            void onNext();
          }}
          disabled={pageIndex === pageCount || isFetching}
        >
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            void onLast();
          }}
          disabled={pageIndex === pageCount || isFetching}
        >
          <ChevronsRight className="text-muted-foreground h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DataTablePagination2;
