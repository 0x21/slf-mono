/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import type { RouterOutputs } from "@fulltemplate/api";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTRPC } from "~/trpc/react";

const addNewMemberToOrganizationSchema = z.object({
  userId: z.string(),
});

type User = RouterOutputs["admin"]["getUsers"][number];

type AddNewMemberToOrganizationSchemeDialogValues = z.infer<
  typeof addNewMemberToOrganizationSchema
>;

interface IProps {
  slug: string;
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  existingUserIds: string[];
}

const AdminAddNewMemberToOrganizationDialog = ({
  slug,
  open,
  setOpen,
  existingUserIds,
}: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.admin.getUsers.queryOptions());
  const mutation = useMutation(
    api.adminPlatform.addNewMemberToOrganization.mutationOptions(),
  );

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddNewMemberToOrganizationSchemeDialogValues>({
    resolver: zodResolver(addNewMemberToOrganizationSchema),
  });
  const userId = watch("userId");

  const onSubmit: SubmitHandler<
    AddNewMemberToOrganizationSchemeDialogValues
  > = async (data) => {
    const toastId = toast.loading("Creating...");

    try {
      const result = await mutation.mutateAsync({
        slug: slug,
        userId: data.userId,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Member added!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizationMembers.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizations.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.authOrganization.getOrganizationMembers.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.authOrganization.getOrganizations.pathFilter(),
        );

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
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. You will be redirected to
              setup.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="member" className="text-muted-foreground">
              Member
            </Label>
            <div className="mt-1">
              <Select
                value={userId}
                onValueChange={(value: string) => {
                  setValue("userId", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {data
                      ?.filter((user) => !existingUserIds.includes(user.id))
                      .map((user) => {
                        return (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center truncate">
                              <NextImage
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full border"
                                src={
                                  user.image ??
                                  `https://avatar.vercel.sh/${user.email}`
                                }
                                alt=""
                                unoptimized
                              />
                              <div className="ml-2 flex flex-col justify-start">
                                <p className="text-primary flex font-medium">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <ErrorText>{errors.userId?.message}</ErrorText>
          </div>

          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAddNewMemberToOrganizationDialog;
