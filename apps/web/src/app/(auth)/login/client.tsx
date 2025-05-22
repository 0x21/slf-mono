/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import type { Route } from "next";
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
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
import { signIn } from "next-auth/react";
// import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { toast as toastSonner } from "sonner";
import { z } from "zod";

import { authSignInErrors } from "@fulltemplate/auth/src/error";

import Providers from "~/app/(auth)/providers";
import ErrorText from "~/components/common/ErrorText";
import VerifyTwoFactorAuthDialog from "~/components/dialog/auth/VerifyTwoFactorAuthDialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { env } from "~/env";
import { login } from "~/lib/actions/login";
import { twoFactor } from "~/lib/actions/two-factor";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginValues = z.infer<typeof loginSchema>;

const magicSchema = z.object({
  email: z.string().email(),
});
type MagicValues = z.infer<typeof magicSchema>;

export default function Client({
  allowedProviders,
  isForgotPasswordEnabled,
}: {
  allowedProviders: string[];
  isForgotPasswordEnabled: boolean;
}) {
  const api = useTRPC();
  const router = useRouter();
  // const posthog = usePostHog();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const email = searchParams.get("email");
  const nextUrl = searchParams.get("nextUrl");
  const error = searchParams.get("error");
  const provider = searchParams.get("provider");

  const [totp, setTotp] = useState("");
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | undefined>();
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  const [remember, setRemember] = useState(true);
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: email ?? "",
    },
  });
  const emailWatch = watch("email");

  const {
    register: registerMagic,
    handleSubmit: handleSubmitMagic,
    watch: watchMagic,
    formState: { errors: errorsMagic, isSubmitting: isSubmittingMagic },
  } = useForm<MagicValues>({
    resolver: zodResolver(magicSchema),
  });
  const emailMagicWatch = watchMagic("email");

  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    const result = await login({
      ...data,
      // invite: invite
    });
    if (!result.success) {
      setValue("password", "");
      toast.error(result.error);
      return;
    }
    if ("twoFactorToken" in result.data && result.data.twoFactorToken) {
      setTwoFactorToken(result.data.twoFactorToken);
      setTwoFactorOpen(true);
      return;
    }
    toast.success("Successfully logged in! Redirecting...", {
      duration: 1000,
    });

    // posthog.identify(result.data.user.id);

    socket.io.engine.close();
    socket.connect();

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

  const onSubmitMagic: SubmitHandler<MagicValues> = async (data) => {
    const result = await signIn("nodemailer", {
      email: data.email,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      redirect: false,
    });
  };

  const onSubmitTwoFactor = async (
    totp: string,
    twoFactorToken: string | undefined,
  ) => {
    setTwoFactorSubmitting(true);
    const payload: Record<string, string> = {};
    if (totp.length === 6) {
      payload.totp = totp;
    } else if (totp.length === 8) {
      payload.backupCode = totp;
    }
    const result = await twoFactor({
      ...payload,
      twoFactorToken: twoFactorToken,
      remember: String(remember),
      redirect: false,
    });
    if (!result.success) {
      setTotp("");
      setTwoFactorSubmitting(false);
      toast.error(result.error ?? "Unable to sign in.");
      return;
    }
    toast.success("Successfully logged in! Redirecting...", {
      duration: 1000,
    });

    setTwoFactorOpen(false);
    setTwoFactorSubmitting(false);

    socket.io.engine.close();
    socket.connect();

    if ("user" in result.data && result.data.requiresPasswordChange) {
      toastSonner("Change password!", {
        description: "Your password needs to be updated for security reasons.",
        duration: 3000,
        icon: <CircleAlert className="size-4 text-yellow-500" />,
      });
      router.push("/settings/security?requires-password-change=true" as Route);
      return;
    }

    router.push((nextUrl ?? "/dashboard") as Route);
    return;
  };

  useEffect(() => {
    if (!error) {
      return;
    }
    toast.success(authSignInErrors[error] ?? "Unable to sign in.");
  }, [error]);

  return (
    <>
      <VerifyTwoFactorAuthDialog
        open={twoFactorOpen}
        setOpen={setTwoFactorOpen}
        isLoading={twoFactorSubmitting}
        totp={totp}
        setTotp={setTotp}
        onSubmit2Fa={(totp) => {
          onSubmitTwoFactor(totp, twoFactorToken);
        }}
      />
      <>
        <h2 className="text-foreground text-xl font-semibold md:text-2xl">
          Sign in
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={
              invite
                ? {
                    pathname: "/register",
                    query: {
                      invite: invite,
                      email: email,
                    },
                  }
                : "/register"
            }
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Create your account.
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
        {provider === null && (
          <form onSubmit={handleSubmit(onSubmit)} className="my-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  defaultValue={searchParams.get("email") ?? ""}
                  autoComplete="email"
                  {...register("email")}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                />
                <ErrorText>{errors.email?.message}</ErrorText>
              </div>
            </div>

            <div>
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1.5 right-2 h-6 w-6 p-1"
                  onClick={() => {
                    setPasswordVisible(!passwordVisible);
                  }}
                >
                  {passwordVisible ? (
                    <EyeIcon className="text-muted-foreground h-full w-full" />
                  ) : (
                    <EyeOffIcon className="text-muted-foreground h-full w-full" />
                  )}
                </Button>
                {errors.password && (
                  <ErrorText>{errors.password?.message}</ErrorText>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(e) =>
                    setRemember(e === "indeterminate" ? true : e)
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-muted-foreground text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              {isForgotPasswordEnabled && (
                <Link
                  href={
                    emailWatch === ""
                      ? "/forgot-password"
                      : `/forgot-password?email=${encodeURIComponent(emailWatch)}`
                  }
                  className="text-muted-foreground text-sm font-medium transition-all duration-150 ease-in-out hover:text-emerald-500"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            <div>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in
                  </>
                ) : (
                  <>Sign in</>
                )}
              </Button>
            </div>
          </form>
        )}
        {provider === "magic" && (
          <form
            onSubmit={handleSubmitMagic(onSubmitMagic)}
            className="my-6 space-y-4"
          >
            <div>
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  defaultValue={searchParams.get("email") ?? ""}
                  autoComplete="email"
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  {...registerMagic("email")}
                />
                <ErrorText>{errorsMagic.email?.message}</ErrorText>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5"></div>
              {isForgotPasswordEnabled && (
                <Link
                  href={
                    emailMagicWatch === ""
                      ? "/forgot-password"
                      : `/forgot-password?email=${encodeURIComponent(emailMagicWatch)}`
                  }
                  className="text-muted-foreground text-sm font-medium transition-all duration-150 ease-in-out hover:text-emerald-500"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            <div>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmittingMagic}
                className="w-full"
              >
                {isSubmittingMagic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in
                  </>
                ) : (
                  <>Sign in with Email</>
                )}
              </Button>
            </div>
          </form>
        )}
      </>

      <Providers
        allowedProviders={allowedProviders.filter(
          (p) =>
            p !== "credentials" && p !== "two-factor" && p !== "impersonate",
        )}
      />
    </>
  );
}
