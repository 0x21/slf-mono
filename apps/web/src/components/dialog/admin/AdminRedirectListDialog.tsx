/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { cn } from "@fulltemplate/common";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

const schema = z
  .object({
    origin: z
      .string()
      .default("/")
      .transform((value) => (value.startsWith("/") ? value : "/" + value)),
    destination: z
      .string()
      .default("/")
      .transform((value) => (value.startsWith("/") ? value : "/" + value)),
  })
  .refine((data) => data.origin !== data.destination, {
    message: "Origin and destination cannot be the same",
    path: ["destination"],
  });

type Values = z.infer<typeof schema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminRedirectListDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.admin.getRedirects.queryOptions());
  const mutation = useMutation(api.admin.createRedirect.mutationOptions());
  const mutation1 = useMutation(api.admin.deleteRedirect.mutationOptions());

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const {
    handleSubmit,
    setValue,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const createRedirect: SubmitHandler<Values> = async (data) => {
    const toastId = toast.loading("Saving...");
    try {
      const result = await mutation.mutateAsync({
        origin: data.origin,
        destination: data.destination,
      });
      if (result.success) {
        toast.success("Successfully saved!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getRedirects.pathFilter(),
        );
        reset();
        return;
      }
      toast.error(`Error: ${result.msg}`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const deleteRedirect = async (id: string) => {
    const toastId = toast.loading("Deleting...");
    try {
      const result = await mutation1.mutateAsync({
        redirectId: id,
      });
      if (result.success) {
        toast.success("Successfully deleted!", {
          id: toastId,
        });

        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getRedirects.pathFilter(),
        );

        return;
      }
      toast.error(`Error: ${result.msg}`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  return (
    <>
      <Dialog open={open ?? false} onOpenChange={handleDialogChange}>
        <DialogContent
          className="max-w-xs rounded-md sm:max-w-[425px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader className="text-left">
            <DialogTitle>Redirects</DialogTitle>
            <DialogDescription>
              Redirects allow you to redirect a specific path to a specific
            </DialogDescription>
          </DialogHeader>

          <div className="mt-0">
            <form onSubmit={handleSubmit(createRedirect)}>
              <div className="mt-4 w-full">
                <Label htmlFor="origin" className="text-muted-foreground">
                  Origin Path
                </Label>
                <div className="relative mt-1 flex grow items-center">
                  <input
                    id="origin"
                    type="text"
                    {...register("origin")}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <ErrorText>{errors.origin?.message}</ErrorText>
              </div>
              <div className="mt-4 w-full">
                <Label htmlFor="destination" className="text-muted-foreground">
                  Destination Path
                </Label>
                <div className="relative mt-1 flex grow items-center">
                  <input
                    id="destination"
                    type="text"
                    {...register("destination")}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <ErrorText>{errors.destination?.message}</ErrorText>
              </div>
              <div className="mt-4 flex w-full justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-8 items-center justify-center p-1.5"
                >
                  <Save className="mr-2 size-4" /> Save
                </Button>
              </div>
            </form>
          </div>
          <div className="w-full">
            <Label htmlFor="configs" className="text-primary">
              Redirects ({data?.length})
            </Label>
            <ScrollArea className="mt-2 flex max-h-60 gap-y-2 overflow-auto">
              {data && data.length > 0 ? (
                data.map((redirect, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "hover:text-primary flex flex-col justify-between rounded-md text-sm opacity-60 hover:cursor-pointer hover:opacity-100",
                    )}
                  >
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-primary text-sm">
                          Origin: <span>{redirect.origin} </span>
                        </div>
                        <div className="text-primary text-sm">
                          Destination: <span>{redirect.destination} </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          void deleteRedirect(redirect.id);
                        }}
                      >
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  No redirect found.
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminRedirectListDialog;
