/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
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
  DialogDescription,
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
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const editUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
});

type User = RouterOutputs["admin"]["getUsers"][number];
type AppConfig = RouterOutputs["admin"]["getAppConfig"];

type EditUserSchemaDialogValues = z.infer<typeof editUserSchema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  user: User;
  userRole: UserRole;
  appConfig: AppConfig;
}

const AdminEditUserDialog = ({
  open,
  setOpen,
  user,
  userRole,
  appConfig,
}: IProps) => {
  const api = useTRPC();
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.admin.updateUser.mutationOptions());

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserSchemaDialogValues>({
    resolver: zodResolver(editUserSchema),
  });
  const role = watch("role");

  const onSubmit: SubmitHandler<EditUserSchemaDialogValues> = async (data) => {
    const toastId = toast.loading("Updating...");

    try {
      const result = await mutation.mutateAsync({
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        email: user.email!,
        emailVerified: data.emailVerified,
        image: data.image,
      });
      if (result.success) {
        setOpen(false);
        toast.success("User information updated!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
        await queryClient.invalidateQueries(
          api.admin.getUserDetails.pathFilter(),
        );

        if (session && session.user.id === user.id) {
          await update({
            ...session,
            user: {
              ...session.user,
              firstName: data.firstName,
              lastName: data.lastName,
              image: data.image,
            },
          });
        }

        socket.emit("userUpdated", {
          userId: user.id,
        });

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

  useEffect(() => {
    setValue("firstName", user.firstName!);
    setValue("lastName", user.lastName!);
    setValue("role", user.role);
    setValue("email", user.email!);
    setValue("emailVerified", user.emailVerified ? true : false);
    setValue("image", user.image);
  }, [user, setValue]);

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
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
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

          {user.accounts
            .map((account) => account.provider)
            .includes("credentials") && (
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
          )}

          {session?.user.id !== user.id && (
            <div className="mt-4 w-full">
              <Label htmlFor="role" className="text-muted-foreground">
                Role
              </Label>{" "}
              <div className="mt-1">
                <Select
                  value={role}
                  onValueChange={(value: string) => {
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
                      )}{" "}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <ErrorText>{errors.role?.message}</ErrorText>
            </div>
          )}

          <div className="mt-4 w-full">
            <Label htmlFor="image" className="text-muted-foreground">
              Image URL
            </Label>
            <div className="mt-1">
              <input
                id="image"
                type="text"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("image")}
              />
            </div>
            <ErrorText>{errors.image?.message}</ErrorText>
          </div>

          {user.accounts
            .map((account) => account.provider)
            .includes("credentials") && (
            <div className="mt-4 flex w-full items-center justify-between">
              <Label htmlFor="emailVerified" className="text-muted-foreground">
                Email Verified
              </Label>
              <div className="flex items-center">
                <Checkbox
                  id="emailVerified"
                  className="h-6 w-6"
                  defaultChecked={user.emailVerified ? true : false}
                  onCheckedChange={(value) =>
                    setValue("emailVerified", value as boolean)
                  }
                />
              </div>
              <ErrorText>{errors.emailVerified?.message}</ErrorText>
            </div>
          )}

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

export default AdminEditUserDialog;
