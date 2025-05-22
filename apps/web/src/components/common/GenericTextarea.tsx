/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import * as React from "react";

import { cn } from "@fulltemplate/common";

import ErrorText from "./ErrorText";

interface GenericTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  errorMessage?: string;
  message: string | undefined;
}
const GenericTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GenericTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <>
      <textarea
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 min-h-32 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
      <div
        id={props.id}
        className={cn(
          "text-muted-foreground flex text-right text-xs",
          props.errorMessage ? "justify-between" : "justify-end",
        )}
        role="status"
        aria-live="polite"
      >
        <ErrorText>{props.errorMessage}</ErrorText>
        {props.maxLength && (
          <span className="flex justify-end pt-1">
            {props.maxLength - (props.message?.length || 0)} characters left
          </span>
        )}
      </div>
    </>
  );
});
GenericTextarea.displayName = "Textarea";

export { GenericTextarea };
