/* eslint-disable */
"use client";

import type { Route } from "next";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@fulltemplate/common";

import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";

type TabRef = HTMLDivElement | null;

export interface GenericTabNav {
  name: string;
  href?: string;

  icon?: any;
}

interface IProps {
  navigation: GenericTabNav[];
  relativePath: string;
  currentPath: string;
  onClick?: (nav: GenericTabNav) => void | Promise<void>;
  selectedTab?: string;
  className?: string;
}

const GenericTabs = ({
  navigation,
  relativePath,
  currentPath,
  selectedTab,
  onClick,
  className,
}: IProps) => {
  const id = useId();

  const parentRef = useRef<HTMLDivElement | null>(null);
  const parentRect = parentRef.current?.getBoundingClientRect().left ?? 0;

  const [tabRefs, _] = useState<TabRef[]>([]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoveredTab = tabRefs[hoveredIdx ?? -1]?.getBoundingClientRect();

  return (
    <ScrollArea key={id}>
      <div
        className={cn(
          "border-border relative flex w-full items-center justify-start space-x-1.5 rounded-none border-b bg-transparent",
          className,
        )}
        ref={parentRef}
        onMouseLeave={() => {
          setHoveredIdx(null);
        }}
      >
        <AnimatePresence>
          {hoveredTab ? (
            <motion.button
              className="bg-muted absolute top-0.5 left-0 rounded-lg"
              initial={{
                left: hoveredTab.left - parentRect,
                width: hoveredTab.width,
                height: 32,
                opacity: 0,
              }}
              animate={{
                left: hoveredTab.left - parentRect,
                width: hoveredTab.width,
                height: 32,
                opacity: 1,
              }}
              exit={{
                left: hoveredTab.left - parentRect,
                width: hoveredTab.width,
                height: 32,
                opacity: 0,
              }}
              transition={{
                duration: 0.14,
              }}
            />
          ) : null}
        </AnimatePresence>
        {navigation.map((nav, index) => {
          return (
            <div
              key={nav.name}
              ref={(el) => {
                tabRefs[index] = el;
              }}
              onPointerEnter={() => setHoveredIdx(index)}
              className="relative"
            >
              {nav.href !== undefined ? (
                <Link
                  href={`${relativePath}${nav.href}` as Route}
                  className={cn(
                    "hover:text-primary my-0.5 flex items-center gap-2 truncate px-3 py-1.5 text-sm font-medium transition-all",
                    (
                      selectedTab
                        ? nav.name.toLowerCase().includes(selectedTab)
                        : currentPath === nav.href
                    )
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                  onClick={async () => {
                    await onClick?.(nav);
                  }}
                >
                  {nav.icon && <nav.icon className="size-4" />}
                  {nav.name}
                </Link>
              ) : (
                <button
                  className="hover:text-primary text-muted-foreground my-0.5 flex items-center gap-2 truncate px-3 py-1.5 text-sm font-medium transition-all"
                  onClick={async () => {
                    await onClick?.(nav);
                  }}
                >
                  {nav.name}
                </button>
              )}
              {(selectedTab
                ? nav.name.toLowerCase().includes(selectedTab)
                : currentPath === nav.href) && (
                <motion.div
                  layoutId={id}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className="bg-primary absolute inset-x-0 bottom-[-1px] h-[2px] w-full"
                />
              )}
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="hidden sm:flex" />
    </ScrollArea>
  );
};

export default GenericTabs;
