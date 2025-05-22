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

import type { RouterOutputs } from "@fulltemplate/api";
import type { UserRole } from "@fulltemplate/auth/src/types";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { generateRandomPassword } from "~/lib/utils/password-generator";
import { useTRPC } from "~/trpc/react";

const createUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  password: z.string().min(6),
  requiresPasswordChange: z.boolean().default(false),
});

type CreateUserSchemaDialogValues = z.infer<typeof createUserSchema>;
type AppConfig = RouterOutputs["admin"]["getAppConfig"];

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  userRole: UserRole;
  appConfig: AppConfig;
}

const AdminCreateUserDialog = ({
  open,
  setOpen,
  userRole,
  appConfig,
}: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.admin.createUser.mutationOptions());

  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserSchemaDialogValues>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit: SubmitHandler<CreateUserSchemaDialogValues> = async (
    data,
  ) => {
    const toastId = toast.loading("Creating...");

    try {
      const result = await mutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        password: data.password,
        requiresPasswordChange: data.requiresPasswordChange,
      });
      if (result.success) {
        setOpen(false);
        toast.success("User created!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
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
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="firstName" className="text-muted-foreground">
              First Name
            </Label>
            <div className="mt-1">
              <input
                id="firstName"
                type="text"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("firstName")}
              />
            </div>
            <ErrorText>{errors.firstName?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="lastName" className="text-muted-foreground">
              Last Name
            </Label>
            <div className="mt-1">
              <input
                id="lastName"
                type="text"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("lastName")}
              />
            </div>
            <ErrorText>{errors.lastName?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="email" className="text-muted-foreground">
              Email
            </Label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("email")}
              />
            </div>
            <ErrorText>{errors.email?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="operator" className="text-muted-foreground">
              Role
            </Label>{" "}
            <div className="mt-1">
              <Select
                onValueChange={(value: "user" | "admin") => {
                  setValue("role", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={"user"}>User</SelectItem>
                    {(userRole === "superadmin" ||
                      (userRole === "admin" &&
                        appConfig.canAdminGiveSameRole)) && (
                      <SelectItem value={"admin"}>Admin</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <ErrorText>{errors.role?.message}</ErrorText>
          </div>

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
                setPasswordVisible(true);
              }}
            >
              Generate Random Password
            </Button>
          </div>
          <div className="mt-4 flex w-full items-center justify-between">
            <Label
              htmlFor="requiresPasswordChange"
              className="text-muted-foreground"
            >
              Require password change on first login
            </Label>
            <div className="flex items-center">
              <Checkbox
                id="requiresPasswordChange"
                className="h-6 w-6"
                onCheckedChange={(value) =>
                  setValue("requiresPasswordChange", value as boolean)
                }
              />
            </div>
            <ErrorText>{errors.requiresPasswordChange?.message}</ErrorText>
          </div>

          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateUserDialog;
