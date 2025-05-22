"use client";

import type { Dispatch, SetStateAction } from "react";
import { CircleX, SearchIcon } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";

interface IProps extends WithClassName {
  search: string | null;
  setSearch: Dispatch<SetStateAction<string | null>>;
}

const GenericSearch = ({ search, setSearch, className }: IProps) => {
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1.5 bottom-0 left-1.5 h-6 w-6 p-1" />
      <input
        placeholder="Search"
        value={search ?? ""}
        onChange={(event) => {
          const s = event.target.value;
          void setSearch(s === "" ? null : s);
        }}
        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border px-3 py-1 pl-8 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
      />
      {search && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1.5 right-2 h-6 w-6 p-1"
          onClick={() => {
            void setSearch(null);
          }}
        >
          <CircleX className="text-muted-foreground h-full w-full" />
        </Button>
      )}
    </div>
  );
};

export default GenericSearch;
