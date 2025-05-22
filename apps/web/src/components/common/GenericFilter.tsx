/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import type { Dispatch, SetStateAction } from "react";
import React, { useMemo } from "react";
import { ChevronDown, ListFilterIcon } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

interface IProps2 extends WithClassName {
  appliedFilters: GenFilterValue[];
}

export const GenericFilterButton = React.forwardRef<HTMLButtonElement, IProps2>(
  ({ appliedFilters, className, ...props }, ref) => {
    return (
      <Button
        variant="outline"
        className={cn("h-9", className)}
        {...props}
        ref={ref}
      >
        <div className="relative mr-1.5">
          {/* @ts-ignore */}
          <ListFilterIcon className="text-muted-foreground h-4 w-4" />
          {appliedFilters.length > 0 && (
            <div className="absolute -top-0.5 -right-0 h-2 w-2 rounded-full bg-blue-500"></div>
          )}
        </div>
        <span className="mr-1">Filter</span>
        {appliedFilters.length > 0 ? (
          <Badge className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
            {appliedFilters.length}
          </Badge>
        ) : (
          <ChevronDown className="text-muted-foreground ml-auto h-4 w-4" />
        )}
      </Button>
    );
  },
);

export interface GenFilter {
  id: string;
  name: string;
  accessorKey: string;
  icon?: any;
  imageUrl?: string;
}

export interface GenFilterValue {
  filter: GenFilter;
  value: string;
}

interface IProps extends WithClassName {
  filters: GenFilter[];
  selectedFilter: GenFilter | undefined;
  setSelectedFilter: Dispatch<SetStateAction<GenFilter | undefined>>;
  appliedFilters: GenFilterValue[];
  setAppliedFilters: Dispatch<SetStateAction<GenFilterValue[]>>;
  data: any[];
  onApplyFilter: (filter: GenFilter, value: string) => void;
}

export function GenericFilter({
  filters,
  selectedFilter,
  setSelectedFilter,
  appliedFilters,
  // setAppliedFilters,
  data,
  onApplyFilter,
  className,
}: IProps) {
  const grouped = useMemo(() => {
    if (!selectedFilter) {
      return [];
    }
    const keys = selectedFilter.accessorKey.split(".");
    const filteredKeys = data.reduce<string[]>((r, a) => {
      let value: any = a;
      for (const k of keys) {
        if (value === undefined || value === null) {
          return r;
        }
        value = value[k];
      }

      if (r.includes(value)) {
        return r;
      }

      if (
        appliedFilters
          .filter((a) => a.filter.id === selectedFilter.id)
          .map((a) => a.value)
          .includes(value)
      ) {
        return r;
      }
      return [...r, value];
    }, []);
    return filteredKeys;
  }, [data, selectedFilter, appliedFilters]);

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex h-6 items-center justify-between">
        <div className="text-muted-foreground text-xs">Filters</div>
      </div>

      {!selectedFilter && (
        <div className="mt-4 flex max-h-36">
          <ScrollArea className="flex w-full gap-y-2">
            {filters
              .filter((f) => {
                const match = appliedFilters.find((a) => a.filter.id === f.id);
                return match === undefined;
              })
              .map((filter) => {
                return (
                  <Button
                    key={filter.id}
                    variant="ghost"
                    className="hover:bg-muted flex h-9 w-full justify-start px-1"
                    onClick={() => {
                      setSelectedFilter(filter);
                    }}
                  >
                    <div className="text-foreground flex items-center text-sm">
                      {filter.icon && (
                        <div>
                          {/* @ts-ignore */}
                          <filter.icon className="text-muted-foreground mr-2 size-4" />
                        </div>
                      )}
                      {filter.imageUrl && (
                        <div>
                          <img
                            src={filter.imageUrl}
                            alt=""
                            className="text-muted-foreground mr-2 size-4"
                          />
                        </div>
                      )}
                      <span className="text-sm">{filter.name}</span>
                    </div>
                  </Button>
                );
              })}
          </ScrollArea>
        </div>
      )}

      {selectedFilter && (
        <div className="mt-4 flex max-h-36">
          <ScrollArea className="flex w-full gap-y-2">
            {grouped.map((group) => {
              let displayValue;

              if (typeof group === "boolean") {
                displayValue = (group as boolean) ? "Yes" : "No";
              } else {
                displayValue = group;
              }

              return (
                <Button
                  key={displayValue}
                  variant="ghost"
                  className="hover:bg-muted flex h-9 w-full justify-start px-1"
                  onClick={() => {
                    onApplyFilter(selectedFilter, group);
                  }}
                >
                  <div className="text-foreground flex items-center text-sm">
                    {displayValue}
                  </div>
                </Button>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
