/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { ChevronsUpDownIcon } from "lucide-react";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { availableLocales } from "~/i18n/locales";
import { setUserLocale } from "~/lib/actions/actions";

export const LanguageSelectButton = React.forwardRef<
  HTMLButtonElement,
  WithClassName
>(({ className, ...props }, ref) => {
  const locale = useLocale();

  const activeLocale = useMemo(() => {
    return availableLocales.find((l) => l.code === locale);
  }, [locale]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("flex h-8 items-center", className)}
      ref={ref}
      {...props}
    >
      {activeLocale ? (
        <>
          <Image
            width={20}
            height={20}
            className="mr-1.5"
            src={`https://flagcdn.com/16x12/${activeLocale.code === "en" ? "gb" : activeLocale.code}.png`}
            alt={activeLocale.name}
            unoptimized
          />
          <span className="text-sm">{activeLocale.name}</span>
          <ChevronsUpDownIcon className="text-muted-foreground ml-1.5 h-4 w-4 shrink-0" />
        </>
      ) : (
        <>
          <div className="border-border h-6 w-6 rounded-full border">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <Skeleton className="ml-1 h-5 w-24" />
        </>
      )}
    </Button>
  );
});

interface IProps extends WithClassName {
  onClose?: () => void;
}

const LanguageSelect = ({ onClose, className }: IProps) => {
  const locale = useLocale();

  const activeLocale = useMemo(() => {
    return availableLocales.find((l) => l.code === locale);
  }, [locale]);

  const handleLanguageSelect = async (code: string) => {
    try {
      await setUserLocale(code);
      onClose?.();
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="text-muted-foreground text-xs">Languages</div>
      <div className="flex flex-col pt-4">
        {availableLocales.map((language) => (
          <button
            key={language.name}
            onClick={() => {
              void handleLanguageSelect(language.code);
            }}
          >
            <div
              className={cn(
                "hover:text-primary flex items-center rounded-md px-2 py-2 text-sm opacity-60 hover:opacity-100",
                language.name === activeLocale?.name &&
                  "bg-muted text-primary opacity-100",
              )}
            >
              <Image
                width={20}
                height={20}
                className="mr-1.5"
                src={`https://flagcdn.com/16x12/${language.code === "en" ? "gb" : language.code}.png`}
                alt={language.name}
                unoptimized
              />
              {language.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelect;
