/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { SubmitHandler } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/trpc/react";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function Page() {
  const api = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email");

  const mutation = useMutation(api.public.forgotPassword.mutationOptions());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: email ?? "",
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async (data) => {
    const toastId = toast.loading("Resetting...");
    try {
      const result = await mutation.mutateAsync({
        email: data.email,
      });
      if (result.success) {
        toast.success("Successfully sent password reset mail!", {
          id: toastId,
        });
        router.push("/login");
        return;
      }
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  return (
    <>
      <h2 className="text-foreground text-xl font-semibold md:text-2xl">
        Forgot password
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Reset your password{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          Go back to sign in.
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="my-6 space-y-4">
        <div>
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
            />
            <ErrorText>{errors.email?.message}</ErrorText>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="mt-2 w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting
              </>
            ) : (
              "Reset"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
