"use client";

import * as React from "react";

import { cn } from "@fulltemplate/common";

import { Switch as BaseSwitch } from "~/components/ui/switch";

interface GenericSwitchProps
  extends React.ComponentPropsWithoutRef<typeof BaseSwitch> {
  id: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  labelOn?: string;
  labelOff?: string;
}

const GenericSwitch = React.forwardRef<
  React.ComponentRef<typeof BaseSwitch>,
  GenericSwitchProps
>(
  (
    {
      id,
      checked,
      onCheckedChange,
      labelOn = "On",
      labelOff = "Off",
      className,
      ...props
    },
    ref,
  ) => (
    <div className="flex items-center">
      <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium md:h-9">
        <BaseSwitch
          id={id}
          ref={ref}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={cn(
            "peer data-[state=checked]:bg-input/50 data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=checked]:[&_span]:translate-x-full rtl:data-[state=checked]:[&_span]:-translate-x-full",
            className,
          )}
          {...props}
        />
        <span className="peer-data-[state=checked]:text-muted-foreground/70 pointer-events-none relative ms-0.5 flex min-w-7 items-center justify-center text-center md:min-w-8">
          <span className="text-[9px] font-medium uppercase md:text-[10px]">
            {labelOff}
          </span>
        </span>
        <span className="peer-data-[state=unchecked]:text-muted-foreground/70 pointer-events-none relative me-0.5 flex min-w-7 items-center justify-center text-center md:min-w-8">
          <span className="text-[9px] font-medium uppercase md:text-[10px]">
            {labelOn}
          </span>
        </span>
      </div>
      <span className="sr-only">Labeled switch</span>
    </div>
  ),
);

GenericSwitch.displayName = "GenericSwitch";

export { GenericSwitch };
