/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { SubmitHandler } from "react-hook-form";
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine(
    (data) => {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function Page() {
  const api = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const otp = searchParams.get("otp");

  const mutation = useMutation(api.public.resetPassword.mutationOptions());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (data) => {
    if (!otp) {
      toast.error("No OTP!");
      return;
    }
    const toastId = toast.loading("Resetting...");
    try {
      const result = await mutation.mutateAsync({
        password: data.password,
        otp: otp,
      });
      if (result.success) {
        toast.success("Successfully reset your password! Please log in.", {
          id: toastId,
          duration: 5000,
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
        Reset password
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">Reset your password</p>

      <form onSubmit={handleSubmit(onSubmit)} className="my-6 space-y-4">
        <div>
          <Label htmlFor="password" className="text-muted-foreground">
            New Password
          </Label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              {...register("password")}
            />
            <ErrorText>{errors.password?.message}</ErrorText>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-muted-foreground">
            Confirm Password
          </Label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              {...register("confirmPassword")}
            />
            <ErrorText>{errors.confirmPassword?.message}</ErrorText>
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
