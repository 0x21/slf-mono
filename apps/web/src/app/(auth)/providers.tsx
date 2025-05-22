"use client";

import type { Route } from "next";
import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Key, Loader2, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

import type { InvalidLoginReason } from "@fulltemplate/auth/src/error";
import { authSignInErrors } from "@fulltemplate/auth/src/error";

import { Button } from "~/components/ui/button";
import { env } from "~/env";

const Providers = ({ allowedProviders }: { allowedProviders: string[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO convert to action
  const onContinueAsGuest = async () => {
    setIsSubmitting(true);
    try {
      const result = await signIn("guest", {
        redirect: false,
      });
      if (!result) {
        toast.error("Unable to sign in.");
        setIsSubmitting(false);
        return;
      }

      if (result.error) {
        if (result.error === "AccessDenied") {
          toast.error(
            "Your account is banned. If you think there is a mistake, please contact us.",
          );
          setIsSubmitting(false);
          return;
        }
        const errorCode = result.code as InvalidLoginReason | (string & {});
        if (errorCode === "internal-error") {
          toast.error("Internal server error! Please try again later.");
          setIsSubmitting(false);
          return;
        }
        if (errorCode === "blocked-ip-address") {
          toast.error(
            "Your IP address is blocked. If you believe this is a mistake, please contact support.",
          );
          setIsSubmitting(false);
          return;
        }
        toast.error(authSignInErrors[result.error] ?? "Unable to sign in.");
        setIsSubmitting(false);
        return;
      }
      if (result.ok) {
        router.push("/dashboard" as Route);
        setIsSubmitting(false);
        return;
      }
      toast.error("Unable to sign in.");
      setIsSubmitting(false);
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {allowedProviders.includes("guest") && (
        <Button
          type="submit"
          variant="link"
          className="w-full"
          disabled={isSubmitting}
          onClick={() => {
            void onContinueAsGuest();
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Guest
              User
            </>
          ) : (
            <>Continue as Guest</>
          )}
        </Button>
      )}
      {allowedProviders.filter((p) => p !== "guest").length !== 0 && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {((allowedProviders.includes("nodemailer") &&
              pathname.includes("login")) ||
              (!allowedProviders.includes("nodemailer") &&
                provider === "magic")) && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (provider === "magic") {
                    router.push("/login");
                    return;
                  }
                  router.push("/login?provider=magic");
                }}
              >
                <span className="sr-only">Sign in with Email</span>
                {!provider ? (
                  <Mail className="text-muted-foreground h-5 w-5" />
                ) : (
                  <Key className="text-muted-foreground h-5 w-5" />
                )}
              </Button>
            )}
            {allowedProviders.includes("google") && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signIn("google", {
                    callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
                  });
                }}
              >
                <span className="sr-only">Sign in with Google</span>
                <Image
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  src="/provider/google.svg"
                  alt="Google logo"
                />
              </Button>
            )}
            {allowedProviders.includes("github") && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signIn("github", {
                    // callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
                  });
                }}
              >
                <span className="sr-only">Sign in with GitHub</span>
                <Image
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  src="/provider/github.svg"
                  alt="Github logo"
                />
              </Button>
            )}
            {allowedProviders.includes("slack") && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signIn("slack", {
                    callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
                  });
                }}
              >
                <span className="sr-only">Sign in with Slack</span>
                <Image
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  src="/provider/slack.svg"
                  alt="Slack logo"
                />
              </Button>
            )}
            {allowedProviders.includes("discord") && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signIn("discord", {
                    // callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
                  });
                }}
              >
                <span className="sr-only">Sign in with Discord</span>
                <Image
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  src="/provider/discord.svg"
                  alt="Discord logo"
                />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Providers;
