import type { Column, Table } from "@tanstack/react-table";
import { CaretSortIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  RouteOff,
} from "lucide-react";

import { cn } from "@fulltemplate/common";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  column: Column<TData, TValue>;
  title?: string;
  buttonClassName?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  table,
  column,
  title,
  className,
  buttonClassName,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title ?? column.columnDef.id}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "data-[state=open]:bg-accent -ml-3 h-8",
              buttonClassName,
            )}
          >
            <span>{title ?? column.columnDef.id}</span>
            {column.getCanSort() && (
              <>
                {column.getIsSorted() === "desc" ? (
                  <ArrowDownWideNarrowIcon className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "asc" ? (
                  <ArrowUpNarrowWideIcon className="ml-2 h-4 w-4" />
                ) : (
                  <CaretSortIcon className="ml-2 h-4 w-4" />
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUpNarrowWideIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDownWideNarrowIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                Desc
              </DropdownMenuItem>
              {column.getIsSorted() !== false && (
                <DropdownMenuItem onClick={() => table.resetSorting()}>
                  <RouteOff className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                  Remove sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeNoneIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
