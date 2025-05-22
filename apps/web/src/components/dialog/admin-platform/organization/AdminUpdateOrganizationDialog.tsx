/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "~/trpc/react";

const editUserSchema = z.object({
  name: z.string(),
  slug: z
    .string()
    .min(1, { message: "Slug must contain at least 1 character" })
    .max(16, { message: "Slug must not exceed 16 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Only lowercase alphanumeric characters and hyphens are allowed",
    }),
  description: z.string().nullable(),
  image: z.string().nullable(),
});

type Organization = RouterOutputs["adminPlatform"]["getOrganizations"][number];

type EditUserSchemaDialogValues = z.infer<typeof editUserSchema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  organization: Organization;
}

const AdminUpdateOrganizationDialog = ({
  open,
  setOpen,
  organization,
}: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.adminPlatform.updateOrganization.mutationOptions(),
  );

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

  const onSubmit: SubmitHandler<EditUserSchemaDialogValues> = async (data) => {
    const toastId = toast.loading("Updating...");

    try {
      const result = await mutation.mutateAsync({
        id: organization.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        image: data.image,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Organization information updated!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizations.pathFilter(),
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

  useEffect(() => {
    setValue("name", organization.name);
    setValue("slug", organization.slug);
    setValue("description", organization.description);
    setValue("image", organization.image);
  }, [organization]);

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
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>{organization.name}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="firstName" className="text-muted-foreground">
              Name
            </Label>
            <div className="mt-1">
              <input
                id="name"
                type="text"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("name")}
              />
            </div>
            <ErrorText>{errors.name?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="slug" className="text-muted-foreground">
              Slug
            </Label>
            <div className="mt-1">
              <input
                id="slug"
                type="text"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                {...register("slug")}
              />
            </div>
            <ErrorText>{errors.slug?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="description" className="text-muted-foreground">
              Description
            </Label>
            <div className="mt-1">
              <textarea
                id="description"
                {...register("description")}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full appearance-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <ErrorText>{errors.description?.message}</ErrorText>
          </div>

          <div className="mt-4 w-full">
            <Label htmlFor="image" className="text-muted-foreground">
              Image
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

export default AdminUpdateOrganizationDialog;
