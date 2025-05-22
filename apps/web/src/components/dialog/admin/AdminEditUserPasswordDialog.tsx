/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip } from "@mui/material";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { generateRandomPassword } from "~/lib/utils/password-generator";
import { useTRPC } from "~/trpc/react";

const editUserPasswordSchema = z.object({
  password: z.string().min(6),
});

type EditUserPasswordSchemaDialogValues = z.infer<
  typeof editUserPasswordSchema
>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  userId: string;
  email: string;
}

const AdminEditUserPasswordDialog = ({
  open,
  setOpen,
  userId,
  email,
}: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(api.admin.updateUserPassword.mutationOptions());

  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<EditUserPasswordSchemaDialogValues>({
    resolver: zodResolver(editUserPasswordSchema),
  });

  const onSubmit: SubmitHandler<EditUserPasswordSchemaDialogValues> = async (
    data,
  ) => {
    const toastId = toast.loading("Updating...");

    try {
      const result = await mutation.mutateAsync({
        userId: userId,
        password: data.password,
      });
      if (result.success) {
        setOpen(false);
        toast.success("User password updated!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
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
            <DialogTitle>Edit User Password</DialogTitle>
            <DialogDescription>For: {email}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full">
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
                  <Tooltip title={"Hide Password"} placement="top" arrow>
                    <EyeIcon className="text-muted-foreground h-full w-full" />
                  </Tooltip>
                ) : (
                  <Tooltip title={"Show Password"} placement="top" arrow>
                    <EyeOffIcon className="text-muted-foreground h-full w-full" />
                  </Tooltip>
                )}
              </Button>
              <ErrorText>{errors.password?.message}</ErrorText>
            </div>
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground p-0 text-xs"
              onClick={() => {
                const randomPass = generateRandomPassword({ length: 12 });
                setValue("password", randomPass);
              }}
            >
              Generate Random Password
            </Button>
          </div>
          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditUserPasswordDialog;
