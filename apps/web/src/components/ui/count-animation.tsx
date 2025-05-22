import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

import { cn } from "~/lib/utils";

function CountAnimation({
  number,
  className,
  duration = 2,
}: {
  number: number;
  className?: string;
  duration?: number;
}) {
  const count = useMotionValue(0);

  const formatted = useTransform(count, (latest) => {
    return Number.isInteger(number) ? Math.round(latest) : latest.toFixed(1);
  });

  useEffect(() => {
    const animation = animate(count, number, { duration: duration });
    return animation.stop;
  }, [count, duration, number]);

  return (
    <motion.span className={cn(className)}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {formatted}
    </motion.span>
  );
}

export { CountAnimation };
