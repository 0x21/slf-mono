/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { handleSignOut } from "~/lib/sign-out";
import { useTRPC } from "~/trpc/react";

const changePasswordSchema = z.object({
  existingPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

type ChangePasswordSchemaDialogValues = z.infer<typeof changePasswordSchema>;

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean>>
    | Dispatch<SetStateAction<boolean | null>>;
}

const ChangePasswordDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation(api.authUser.changePassword.mutationOptions());

  const [passwordVisible, setPasswordVisible] = useState([false, false]);

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordSchemaDialogValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit: SubmitHandler<ChangePasswordSchemaDialogValues> = async (
    data,
  ) => {
    const toastId = toast.loading("Changing...");

    try {
      const result = await mutation.mutateAsync({
        existingPassword: data.existingPassword,
        newPassword: data.newPassword,
      });
      if (result.success) {
        setOpen(false);
        toast.success(
          "Password changed successfully! You're redirecting to login...",
          {
            id: toastId,
          },
        );
        await queryClient.invalidateQueries(api.pathFilter());
        await handleSignOut();
        router.push("/");
        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  const togglePasswordVisibility = (index: number) => {
    setPasswordVisible((prev) => {
      const newVisibility = [...prev];
      newVisibility[index] = !newVisibility[index];
      return newVisibility;
    });
  };

  return (
    <Dialog open={open ?? false} onOpenChange={handleDialogChange}>
      <DialogContent
        className="max-w-xs rounded-md sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="text-left">
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="existingPassword" className="text-muted-foreground">
              Existing Password
            </Label>
            <div className="relative mt-1">
              <input
                id="existingPassword"
                type={passwordVisible[0] ? "text" : "password"}
                {...register("existingPassword")}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-2 h-6 w-6 p-1"
                onClick={() => togglePasswordVisibility(0)}
              >
                {passwordVisible[0] ? (
                  <EyeIcon className="text-muted-foreground h-full w-full" />
                ) : (
                  <EyeOffIcon className="text-muted-foreground h-full w-full" />
                )}
              </Button>
              <ErrorText>{errors.existingPassword?.message}</ErrorText>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Label htmlFor="newPassword" className="text-muted-foreground">
              New Password
            </Label>
            <div className="relative mt-1">
              <input
                id="newPassword"
                type={passwordVisible[1] ? "text" : "password"}
                {...register("newPassword")}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-2 h-6 w-6 p-1"
                onClick={() => togglePasswordVisibility(1)}
              >
                {passwordVisible[1] ? (
                  <EyeIcon className="text-muted-foreground h-full w-full" />
                ) : (
                  <EyeOffIcon className="text-muted-foreground h-full w-full" />
                )}
              </Button>
              <ErrorText>{errors.newPassword?.message}</ErrorText>
            </div>
          </div>

          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
