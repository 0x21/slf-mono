/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import ErrorText from "~/components/common/ErrorText";
import { GenericTextarea } from "~/components/common/GenericTextarea";
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
import { MultiSelectCombobox } from "~/components/ui/multi-select-combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTRPC } from "~/trpc/react";

const creatOrganizationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 100 characters"),
  ownerUserId: z.string(),
  memberUserIds: z.array(z.string()).optional(),
  image: z.string().nullable(),
});

type CreateOrganizationSchemaDialogValues = z.infer<
  typeof creatOrganizationSchema
>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminCreateOrganizationDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.admin.getUsers.queryOptions());
  const mutation = useMutation(
    api.adminPlatform.createOrganization.mutationOptions(),
  );

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationSchemaDialogValues>({
    resolver: zodResolver(creatOrganizationSchema),
  });
  const ownerUserId = watch("ownerUserId");
  const memberIds = watch("memberUserIds");

  const onSubmit: SubmitHandler<CreateOrganizationSchemaDialogValues> = async (
    data,
  ) => {
    const toastId = toast.loading("Creating...");
    if (!isValidImage) {
      toast.error("Invalid image URL! Please provide a valid image URL.", {
        id: toastId,
      });
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        name: data.name,
        description: data.description,
        image: data.image,
        ownerUserId: data.ownerUserId,
        memberUserIds: data.memberUserIds,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Organization created!", { id: toastId });
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
  const [isValidImage, setIsValidImage] = useState(true);
  const imageUrl = watch("image");

  useEffect(() => {
    const validateImageUrl = (url: string) => {
      if (!url) {
        setIsValidImage(true);
        return;
      }

      const img = new Image();
      img.src = url;

      img.onload = () => {
        setIsValidImage(true);
      };

      img.onerror = () => {
        setIsValidImage(false);
      };
    };

    if (!imageUrl) {
      return;
    }

    validateImageUrl(imageUrl);
  }, [imageUrl]);

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
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Enter the name of your organization. You will be redirected to
              setup.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="name" className="text-muted-foreground">
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
            <Label htmlFor="description" className="text-muted-foreground">
              Description
            </Label>
            <div className="mt-1">
              <GenericTextarea
                id="description"
                {...register("description")}
                maxLength={200}
                errorMessage={errors.description?.message}
                message={watch("description")}
                className="min-h-20"
              />
            </div>
            <ErrorText>{errors.description?.message}</ErrorText>
          </div>
          <div className="mt-4 w-full">
            <Label htmlFor="owner" className="text-muted-foreground">
              Owner
            </Label>
            <div className="mt-1">
              <Select
                value={ownerUserId}
                onValueChange={(value: string) => {
                  setValue("ownerUserId", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {data?.map((user) => {
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
            <ErrorText>{errors.ownerUserId?.message}</ErrorText>
          </div>
          <div className="mt-4 w-full">
            <Label htmlFor="members" className="text-muted-foreground">
              Members
            </Label>
            <div className="mt-1">
              <MultiSelectCombobox
                label="members"
                options={
                  data
                    ?.filter((user) => user.id !== ownerUserId)
                    .map((user) => {
                      return {
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`,
                        description: user.email,
                        icon: () => (
                          <NextImage
                            width={32}
                            height={32}
                            className="mr-2 h-8 w-8 rounded-full border border-gray-200"
                            src={
                              user.image ??
                              `https://avatar.vercel.sh/${user.email}`
                            }
                            alt=""
                            unoptimized
                          />
                        ),
                      };
                    }) ?? []
                }
                value={watch("memberUserIds") ?? []}
                onChange={(values) => {
                  setValue("memberUserIds", values);
                }}
                renderItem={(option: {
                  value: string;
                  label: string;
                  description: string | null;
                  icon: any;
                }) => {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        <option.icon />
                      </span>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  );
                }}
                renderSelectedItem={(value: string[]) => {
                  const members = data?.filter(
                    (user) =>
                      user.id !== ownerUserId && value.includes(user.id),
                  );
                  return (
                    <div className="flex items-center gap-1">
                      {value.map((id) => {
                        const member = data
                          ?.filter((user) => user.id !== ownerUserId)
                          .find((t) => t.id === id);
                        return (
                          <Tooltip
                            key={id}
                            title={`${member?.firstName} ${member?.lastName}`}
                            arrow
                            placement="top"
                          >
                            <NextImage
                              key={id}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full"
                              src={
                                member?.image ??
                                `https://avatar.vercel.sh/${member?.email}`
                              }
                              alt=""
                              unoptimized
                            />
                          </Tooltip>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </div>
            <ErrorText>{errors.memberUserIds?.message}</ErrorText>
          </div>
          <div className="mt-4 w-full">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="image" className="text-muted-foreground">
                Image URL
              </Label>
              {isValidImage && imageUrl && imageUrl.length > 0 && (
                <NextImage
                  width={16}
                  height={16}
                  className="h-6 w-6 cursor-pointer rounded-full"
                  src={imageUrl}
                  alt="Organization image"
                  unoptimized
                  onClick={() => {
                    window.open(imageUrl, "_blank");
                  }}
                />
              )}
            </div>
            <div className="relative">
              <input
                id="image"
                type="text"
                {...register("image")}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring block h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 pl-8 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter URL"
              />
              <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                {isValidImage ? (
                  <Check className="mr-2 size-5 text-green-500" />
                ) : (
                  <X className="mr-2 size-5 text-red-500" />
                )}
              </div>
            </div>
            <ErrorText>{errors.image?.message}</ErrorText>
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

export default AdminCreateOrganizationDialog;
