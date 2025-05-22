/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import { BRAND_NAME, cn } from "@fulltemplate/common";

import { useTRPC } from "~/trpc/react";

const EmailVerifyBanner = () => {
  const api = useTRPC();
  const [isBannerActive, setIsBannerActive] = useLocalStorage<boolean>(
    "email-verify-banner-status",
    true,
  );
  const [isVerified, setIsVerified] = useLocalStorage<boolean>(
    "email-verified",
    false,
  );
  const { data, isLoading } = useQuery(
    api.authUser.checkEmailVerification.queryOptions(undefined, {
      enabled: !isVerified && isBannerActive,
    }),
  );

  const mutation = useMutation(api.authUser.sendVerifyEmail.mutationOptions());

  const [isSent, setIsSent] = useState(false);

  const onSubmit = async () => {
    setIsSent(true);
    try {
      const result = await mutation.mutateAsync();
      if (result.success) {
        toast.success("Successfully sent verify account mail!");
        return;
      }
      toast.error(`Error: ${result.msg}`);
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
    setIsSent(false);
  };

  useEffect(() => {
    if (isVerified) {
      return;
    }
    if (!data) {
      return;
    }
    if (!data.data) {
      return;
    }
    if (data.data.verified) {
      setIsVerified(true);
      return;
    }
    if (data.data.existEmail) {
      setIsVerified(false);
      setIsSent(true);
      return;
    }
  }, [data, isVerified, setIsVerified]);

  if (isVerified) {
    return null;
  }
  if (!isBannerActive) {
    return null;
  }
  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-muted/40 flex w-full items-center gap-x-6 border-b px-6 py-2.5 sm:px-3.5 md:h-[56px]">
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 sm:justify-center">
        <p className="text-primary text-sm leading-6">
          <strong className="text-primary font-semibold">{BRAND_NAME}</strong>
          <svg
            viewBox="0 0 2 2"
            aria-hidden="true"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
          >
            <circle r={1} cx={1} cy={1} />
          </svg>
          Please verify your email
        </p>
        <button
          type="button"
          disabled={mutation.isPending || isSent || data?.data?.existEmail}
          onClick={onSubmit}
          className={cn(
            "flex-none rounded-full px-3.5 py-1 text-sm font-semibold shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600",
            mutation.isPending || isSent || data?.data?.existEmail
              ? "bg-gray-400 text-gray-200"
              : "bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-300 dark:text-gray-900 dark:hover:bg-gray-400",
          )}
        >
          {mutation.isPending ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending email
            </div>
          ) : (
            <>
              {isSent ? (
                <>Email sent!</>
              ) : (
                <>
                  Verify now <span className="ml-2">&rarr;</span>
                </>
              )}
            </>
          )}
        </button>

        {isSent && (
          <div className="flex flex-row gap-x-2">
            <Link
              href="https://mail.google.com"
              target="_blank"
              rel="noreferrer"
            >
              <Image
                src="/gmail.svg"
                alt="gmail"
                width={32}
                height={32}
                className="h-8"
                unoptimized
              />
            </Link>
            <Link
              href="https://outlook.live.com"
              target="_blank"
              rel="noreferrer"
            >
              <Image
                src="/outlook.svg"
                alt="outlook"
                width={32}
                height={32}
                className="h-8"
                unoptimized
              />
            </Link>
          </div>
        )}
      </div>
      <button
        type="button"
        className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
        onClick={() => {
          setIsBannerActive(false);
        }}
      >
        <X aria-hidden="true" className="text-primary h-5 w-5" />
      </button>
    </div>
  );
};

const DynamicEmailVerifyBanner = dynamic(
  () => Promise.resolve(EmailVerifyBanner),
  { ssr: false },
);

export default DynamicEmailVerifyBanner;
