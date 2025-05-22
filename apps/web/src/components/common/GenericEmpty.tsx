import { Construction } from "lucide-react";

import { cn } from "@fulltemplate/common";

import type { WithChildren } from "~/lib/types";

const GenericEmpty = ({ className }: WithChildren) => {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <div className="flex items-center">
        <Construction className="mr-2 h-4 w-4" />
        No results
      </div>
    </div>
  );
};

export default GenericEmpty;
