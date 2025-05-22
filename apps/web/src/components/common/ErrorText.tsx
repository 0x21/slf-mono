import { cn } from "@fulltemplate/common";

import type { WithChildren } from "~/lib/types";

const ErrorText = ({ children, className }: WithChildren) => {
  return (
    <>
      {children && (
        <p className={cn("pt-1 text-xs text-red-500", className)}>{children}</p>
      )}
    </>
  );
};

export default ErrorText;
