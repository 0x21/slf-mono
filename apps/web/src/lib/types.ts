import type { PropsWithChildren } from "react";

export type WithChildren<T = object> = T & {
  className?: string;
} & PropsWithChildren<object>;

export type WithClassName<T = object> = T & {
  className?: string;
};
