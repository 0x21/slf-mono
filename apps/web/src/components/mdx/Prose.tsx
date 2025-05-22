import { cn } from "@fulltemplate/common";

export function Prose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn(className, "prose max-w-full")} {...props} />
    // <div className={clsx(className, "prose dark:prose-invert")} {...props} />
  );
}
