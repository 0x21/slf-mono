/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { Table } from "@tanstack/react-table";
import React from "react";
import { CheckIcon, ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";

interface IProps2 extends WithClassName {
  table: Table<any>;
}

export const GenericDisplayButton = React.forwardRef<
  HTMLButtonElement,
  IProps2
>(({ table, className, ...props }, ref) => {
  const allColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());
  const allColumnCount = allColumns.length;
  const visibleColumnCount = allColumns.filter((column) =>
    column.getIsVisible(),
  ).length;
  const isDefault = allColumnCount === visibleColumnCount;
  return (
    <Button
      variant="outline"
      className={cn("h-9", className)}
      {...props}
      ref={ref}
    >
      <div className="relative mr-1.5">
        {/* @ts-ignore */}
        <SlidersHorizontal className="text-muted-foreground h-4 w-4" />
        {!isDefault && (
          <div className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-blue-500"></div>
        )}
      </div>
      <span className="mr-1">Display</span>
      {/* @ts-ignore */}
      <ChevronDown className="text-muted-foreground ml-auto h-4 w-4" />
    </Button>
  );
});

interface IProps<TData> extends WithClassName {
  table: Table<TData>;
}

export function GenericDisplay<TData>({ table, className }: IProps<TData>) {
  const allColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());
  const allColumnCount = allColumns.length;
  const visibleColumnCount = allColumns.filter((column) =>
    column.getIsVisible(),
  ).length;
  const isDefault = allColumnCount === visibleColumnCount;

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex h-6 items-center justify-between">
        <div className="text-muted-foreground text-xs">Displayed columns</div>
        {!isDefault && (
          <Button
            variant="outline"
            className="h-6 text-xs md:h-8"
            onClick={() => {
              for (const column of allColumns) {
                column.toggleVisibility(true);
              }
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-y-2">
        {allColumns.map((column) => {
          return (
            <div
              key={column.id}
              className={cn(
                "text-foreground hover:bg-muted/70 flex cursor-pointer items-center rounded-md px-2 py-2 text-sm transition-all duration-150 ease-in-out",
                column.getIsVisible() && "bg-muted rounded-md",
              )}
              onClick={() => {
                column.toggleVisibility(!column.getIsVisible());
              }}
            >
              {column.id}
              {column.getIsVisible() && (
                <CheckIcon className="text-foreground ml-auto h-4 w-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
