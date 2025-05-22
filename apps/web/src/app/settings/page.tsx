/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/trpc/react";

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  url: z.string().nullable(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function Page() {
  const api = useTRPC();
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.authUser.getUser.queryOptions());
  const mutation = useMutation(api.authUser.updateUserInfo.mutationOptions());

  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });
  const [isValidImage, setIsValidImage] = useState(true);

  const imageUrl = watch("url");

  const onSubmit: SubmitHandler<UserFormValues> = async (formData) => {
    if (!data) {
      return;
    }
    const toastId = toast.loading("Updating...");

    try {
      const result = await mutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        image: formData.url,
      });
      if (result.success) {
        toast.success("User information updated!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
        await queryClient.invalidateQueries(
          api.admin.getUserDetails.pathFilter(),
        );
        await queryClient.invalidateQueries(api.authUser.getUser.pathFilter());

        if (session) {
          await update({
            ...session,
            user: {
              ...session.user,
              firstName: formData.firstName,
              lastName: formData.lastName,
              image: formData.url,
            },
          });
        }

        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    setValue("firstName", data.firstName ?? "");
    setValue("lastName", data.lastName ?? "");
    setValue("url", data.image);
  }, [data, setValue]);

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="firstName" className="text-muted-foreground">
                First Name
              </Label>
              <div className="mt-1">
                <input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <ErrorText>{errors.firstName?.message}</ErrorText>
            </div>

            <div>
              <Label htmlFor="lastName" className="text-muted-foreground">
                Last Name
              </Label>
              <div className="mt-1">
                <input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <ErrorText>{errors.lastName?.message}</ErrorText>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="image" className="text-muted-foreground">
                  Image URL
                </Label>
                <div className="flex items-center">
                  {isValidImage && imageUrl && imageUrl.length > 0 ? (
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
                  ) : (
                    <>
                      {isValidImage ? (
                        <div className="h-6 w-6" />
                      ) : (
                        <X className="mr-2 h-6 w-6 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="relative mt-1">
                <input
                  id="image"
                  type="text"
                  {...register("url")}
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
              <ErrorText>{errors.url?.message}</ErrorText>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-end border-t px-6 py-4">
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
