/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  BuildingIcon,
  CircleAlert,
  EyeIcon,
  EyeOffIcon,
  Loader2,
  MailIcon,
} from "lucide-react";
// import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { toast as toastSonner } from "sonner";
import { z } from "zod";

import { authSignInErrors } from "@fulltemplate/auth/src/error";

import Providers from "~/app/(auth)/providers";
import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { register as registerAuth } from "~/lib/actions/register";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function Client({
  allowedProviders,
}: {
  allowedProviders: string[];
}) {
  const api = useTRPC();
  const router = useRouter();
  // const posthog = usePostHog();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const email = searchParams.get("email");
  const nextUrl = searchParams.get("nextUrl");
  const error = searchParams.get("error");

  const [passwordVisible, setPasswordVisible] = useState(false);

  const { data, isLoading } = useQuery(
    api.public.getOrganizationByInviteToken.queryOptions(
      {
        token: invite!,
      },
      {
        enabled: invite !== null,
      },
    ),
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: email ?? "",
    },
  });

  const onSubmit: SubmitHandler<RegisterValues> = async (data) => {
    const result = await registerAuth({
      ...data,
      // invite: invite,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Successfully registered! Redirecting...", {
      duration: 1000,
    });

    socket.io.engine.close();
    socket.connect();

    // posthog.identify(result.data!.user.id);

    if ("user" in result.data && result.data.requiresPasswordChange) {
      toastSonner("Change password!", {
        description: "Your password needs to be updated for security reasons.",
        duration: 3000,
        icon: <CircleAlert className="size-4 text-yellow-500" />,
      });
      router.push("/settings/security?requires-password-change=true" as Route);
      return;
    }
    if ("user" in result.data && result.data.requiresTwoFactorAuth) {
      toastSonner("Two factor required!", {
        description:
          "Two factor authentication needs to be added to your account for security reasons.",
        duration: 3000,
        icon: <CircleAlert className="size-4 text-yellow-500" />,
      });
      router.push("/settings/security?requires-two-factor=true" as Route);
      return;
    }

    router.push((nextUrl ?? "/dashboard") as Route);
    return;
  };

  useEffect(() => {
    if (!error) {
      return;
    }
    toast.error(authSignInErrors[error] ?? "Unable to sign in.");
  }, [error]);

  return (
    <>
      <h2 className="text-foreground text-xl font-semibold md:text-2xl">
        Sign up{invite !== null && " by invite"}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Already have an account?{" "}
        <Link
          href={
            invite
              ? {
                  pathname: "/login",
                  query: {
                    invite: invite,
                    email: email,
                  },
                }
              : "/login"
          }
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          Log in.
        </Link>
      </p>
      {invite !== null && (
        <>
          <div className="items-centerm mt-6 flex">
            {isLoading && (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Loading invite details
                </span>
              </div>
            )}
            {!isLoading && data !== null && data !== undefined && (
              <div className="textsm flex items-center">
                <BuildingIcon className="mr-2 h-4 w-4" />
                You will be joining the organization:{" "}
                <span className="ml-1 font-semibold">{data.name}</span>
              </div>
            )}
            {!isLoading && data === null && (
              <div className="flex items-center text-red-500">
                <MailIcon className="mr-2 h-4 w-4" />
                <span className="text-sm">Invalid invite!</span>
              </div>
            )}
          </div>
        </>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="first-name" className="text-muted-foreground">
            First name
          </Label>
          <div className="mt-1">
            <input
              id="first-name"
              type="text"
              autoComplete="first-name"
              {...register("firstName")}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              // disabled={!allowedProviders.includes("credentials")}
            />
            <ErrorText>{errors.firstName?.message}</ErrorText>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="last-name" className="text-muted-foreground">
            Last name
          </Label>
          <div className="mt-1">
            <input
              id="last-name"
              type="text"
              autoComplete="last-name"
              {...register("lastName")}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              // disabled={!allowedProviders.includes("credentials")}
            />
            <ErrorText>{errors.lastName?.message}</ErrorText>
          </div>
        </div>

        <div className="col-span-2">
          <Label htmlFor="email" className="text-muted-foreground">
            Email address
          </Label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              // disabled={!allowedProviders.includes("credentials")}
            />
            <ErrorText>{errors.email?.message}</ErrorText>
          </div>
        </div>

        <div className="col-span-2">
          <Label htmlFor="password" className="text-muted-foreground">
            Password
          </Label>
          <div className="relative mt-1">
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              // disabled={!allowedProviders.includes("credentials")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1.5 right-2 h-6 w-6 p-1"
              onClick={() => {
                setPasswordVisible(!passwordVisible);
              }}
              // disabled={!allowedProviders.includes("credentials")}
            >
              {passwordVisible ? (
                <EyeIcon className="text-muted-foreground h-full w-full" />
              ) : (
                <EyeOffIcon className="text-muted-foreground h-full w-full" />
              )}
            </Button>
            <ErrorText>{errors.password?.message}</ErrorText>
          </div>
        </div>

        <div className="col-span-2">
          <Button
            type="submit"
            variant="default"
            // disabled={isSubmitting || !allowedProviders.includes("credentials")}
            disabled={isSubmitting}
            className="mt-2 w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing up
              </>
            ) : (
              "Sign up"
            )}
            {/* {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing up
              </>
            ) : !allowedProviders.includes("credentials") ? (
              "This sign up method is temporarily disabled"
            ) : (
              "Sign up"
            )} */}
          </Button>
        </div>
      </form>
      <Providers
        allowedProviders={allowedProviders.filter(
          (p) =>
            p !== "credentials" && p !== "two-factor" && p !== "impersonate",
        )}
      />
    </>
  );
}
