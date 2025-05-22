// React and hooks imports
import React, { useState } from "react";
// Utility imports
// Third-party component imports
import { Check, ChevronsUpDown, X } from "lucide-react";

// Local UI component imports
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea, ScrollBar } from "./scroll-area";

/**
 * Base interface for option items in the multi-select combobox
 * @property label - Display text for the option
 * @property value - Unique identifier for the option
 */
export interface BaseOption {
  label: string;
  value: string;
}

/**
 * Generic type for extending BaseOption with additional properties
 */
export type Option<T extends BaseOption = BaseOption> = T;

/**
 * Props interface for the MultiSelectCombobox component
 * @template T - Type extending BaseOption
 */
interface Props<T extends BaseOption> {
  /** Label for the combobox */
  label: string;
  /** Custom render function for individual options */
  renderItem: (option: T) => React.ReactNode;
  /** Custom render function for selected items display */
  renderSelectedItem: (value: string[]) => React.ReactNode;
  /** Array of available options */
  options: T[];
  /** Array of selected values */
  value: string[];
  /** Callback function when selection changes */
  onChange: (value: string[]) => void;
  /** Optional placeholder text for search input */
  placeholder?: string;
}

/**
 * A customizable multi-select combobox component with type safety
 * @template T - Type extending BaseOption
 */
export const MultiSelectCombobox = <T extends BaseOption>({
  label,
  renderItem,
  renderSelectedItem,
  options,
  value,
  onChange,
  placeholder,
}: Props<T>) => {
  // State for controlling popover visibility
  const [open, setOpen] = useState(false);

  /**
   * Handles the selection/deselection of an option
   * @param currentValue - The value to toggle
   */
  const handleChange = (currentValue: string) => {
    onChange(
      value.includes(currentValue)
        ? value.filter((val) => val !== currentValue)
        : [...value, currentValue],
    );
  };

  /**
   * Clears all selected values
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="multi-select-options"
          aria-label={`Select ${label}`}
          tabIndex={0}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-10 min-w-[200px] cursor-pointer items-center justify-start gap-2 rounded-md border px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none"
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setOpen(!open);
            }
          }}
        >
          <div className="flex items-center overflow-hidden font-normal">
            <ScrollArea className="flex items-center gap-2">
              {value.length > 0
                ? renderSelectedItem(value)
                : `Select ${label}...`}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Control buttons */}
          <span className="z-10 ml-auto flex items-center gap-2">
            {value.length > 0 && (
              <button
                type="button"
                aria-label="Clear selection"
                className="z-10 rounded-sm opacity-50 hover:opacity-100 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                onClick={handleClear}
              >
                <X className="size-4 shrink-0" />
              </button>
            )}
            <ChevronsUpDown
              className="size-4 shrink-0 opacity-50"
              aria-hidden="true"
            />
          </span>
        </div>
      </PopoverTrigger>

      {/* Dropdown content */}
      <PopoverContent className="p-0" id="multi-select-options">
        <Command>
          <CommandInput
            className="placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border border-none bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder ?? `Search ${label}...`}
            aria-label={`Search ${label}`}
          />
          <CommandList>
            <CommandEmpty>No {label} found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleChange(option.value)}
                  aria-selected={value.includes(option.value)}
                  className="flex items-center justify-between"
                >
                  {renderItem(option)}
                  {value.includes(option.value) && (
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
