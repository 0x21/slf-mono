"use client";

import React from "react";
import { CheckIcon, ChevronDown } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

interface IProps2 extends WithClassName {
  label: string;
  icon: any;
  selectedCount: number;
}

export const GenericMultiSelectButton = React.forwardRef<
  HTMLButtonElement,
  IProps2
>(({ label, icon: Icon, selectedCount, className, ...props }, ref) => {
  return (
    <Button
      variant="outline"
      className={cn("h-9", className)}
      {...props}
      ref={ref}
    >
      <div className="relative mr-1.5">
        <Icon className="text-muted-foreground h-4 w-4" />
        {selectedCount > 0 && (
          <div className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-blue-500"></div>
        )}
      </div>
      <span className="mr-1">{label}</span>
      {/* @ts-ignore */}
      <ChevronDown className="text-muted-foreground ml-auto h-4 w-4" />
    </Button>
  );
});

interface IOption {
  id: string;
  label: string;
}

interface IProps extends WithClassName {
  label: string;
  options: IOption[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

export function GenericMultiSelect({
  label,
  options,
  selectedOptions,
  onChange,
  className,
}: IProps) {
  const toggleOption = (id: string) => {
    if (selectedOptions.includes(id)) {
      onChange(selectedOptions.filter((item) => item !== id));
    } else {
      onChange([...selectedOptions, id]);
    }
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex h-6 items-center justify-between">
        <div className="text-muted-foreground text-xs">{label}</div>
        {options.length !== selectedOptions.length && (
          <Button
            variant="outline"
            className="h-6 text-xs md:h-8"
            onClick={() => {
              onChange(options.map((option) => option.id));
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-y-2">
        <ScrollArea className="max-h-40 overflow-hidden">
          {options.map((option) => {
            return (
              <div
                key={option.id}
                className={cn(
                  "text-foreground hover:bg-muted/70 flex cursor-pointer items-center rounded-md px-2 py-2 text-sm transition-all duration-150 ease-in-out",
                  selectedOptions.includes(option.id) && "bg-muted rounded-md",
                )}
                onClick={() => {
                  toggleOption(option.id);
                }}
              >
                {option.label}
                {selectedOptions.includes(option.id) && (
                  <CheckIcon className="text-foreground ml-auto h-4 w-4" />
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
