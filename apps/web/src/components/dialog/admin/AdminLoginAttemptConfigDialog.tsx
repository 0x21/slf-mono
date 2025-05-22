/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { cn } from "@fulltemplate/common";

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
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

const updateSchema = z
  .object({
    id: z.string(),
    attemptCount: z.number().min(1, "Attempts must be at least 1"),
    lockDuration: z.number(),
    isLockPermanent: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isLockPermanent && data.lockDuration < 1) {
      ctx.addIssue({
        path: ["lockDuration"],
        message: "Lock duration must be at least 1 minute",
        code: z.ZodIssueCode.custom,
      });
    }
  });

type UpdateValues = z.infer<typeof updateSchema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminLoginAttemptConfigDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    api.admin.getLoginAttemptConfigs.queryOptions(),
  );
  const mutation = useMutation(
    api.admin.updateLoginAttemptConfigs.mutationOptions(),
  );

  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  const details = useMemo(() => {
    return data?.find((cfg) => cfg.id === selectedConfig) ?? null;
  }, [data, selectedConfig]);

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { isSubmitting, errors },
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  });

  const onSubmit: SubmitHandler<UpdateValues> = async (data) => {
    const toastId = toast.loading("Updating...");
    try {
      const result = await mutation.mutateAsync({
        id: data.id,
        attemptCount: data.attemptCount,
        lockDuration: data.lockDuration,
        isLockPermanent: data.isLockPermanent,
      });
      if (result.success) {
        toast.success("Successfully updated!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getLoginAttemptConfigs.pathFilter(),
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

  const isLockPermanent = watch("isLockPermanent");

  useEffect(() => {
    if (!details) {
      return;
    }

    setValue("id", details.id);
    setValue("attemptCount", details.attemptCount);
    setValue("lockDuration", details.lockDuration);
    setValue("isLockPermanent", details.isLockPermanent);
  }, [details, setValue]);

  useEffect(() => {
    setSelectedConfig(null);
  }, [open]);

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
            <DialogTitle>Login Attempt Configurations</DialogTitle>
            <DialogDescription>
              Review and manage login attempt configurations.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full">
            <Label htmlFor="configs" className="text-primary">
              Available Configurations
            </Label>

            <ScrollArea className="mt-4 max-h-60 overflow-auto">
              {data?.map((cfg) => (
                <div
                  key={cfg.id}
                  className={cn(
                    "hover:text-primary flex flex-col justify-between rounded-md px-2 py-2 text-sm opacity-60 hover:cursor-pointer hover:opacity-100",
                    cfg.id === selectedConfig &&
                      "bg-muted text-primary opacity-100",
                  )}
                  onClick={() => setSelectedConfig(cfg.id)}
                >
                  {!cfg.isLockPermanent && (
                    <div className="flex items-center justify-between">
                      <div className="text-primary text-sm">Lock Duration</div>
                      <div className="text-muted-foreground text-sm">
                        {cfg.lockDuration} min
                      </div>
                    </div>
                  )}
                  {cfg.isLockPermanent && (
                    <div className="flex items-center justify-between">
                      <div className="text-primary text-sm">Lock Duration</div>
                      <div className="text-muted-foreground text-sm">
                        Indefinitely
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-primary text-sm">Attempts Allowed</div>
                    <div className="text-muted-foreground text-sm">
                      {cfg.attemptCount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-primary text-sm">Permanent Lock</div>
                    <div className="text-muted-foreground text-sm">
                      {cfg.isLockPermanent ? (
                        <CircleCheck className="size-4 text-green-500" />
                      ) : (
                        <CircleX className="size-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {details && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col space-y-2 border-t"
            >
              <div className="mt-4 w-full">
                <Label htmlFor="attemptCount" className="text-muted-foreground">
                  Attempts Allowed
                </Label>
                <input
                  id="attemptCount"
                  type="number"
                  {...register("attemptCount", {
                    setValueAs: (value) => Number(value),
                  })}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                />
                <ErrorText>{errors.attemptCount?.message}</ErrorText>
              </div>

              {!isLockPermanent && (
                <div className="mt-4 w-full">
                  <Label
                    htmlFor="lockDuration"
                    className="text-muted-foreground"
                  >
                    Lock Duration
                  </Label>
                  <input
                    id="lockDuration"
                    type="number"
                    {...register("lockDuration", {
                      setValueAs: (value) => Number(value),
                    })}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <ErrorText>{errors.lockDuration?.message}</ErrorText>
                </div>
              )}

              <div className="mt-4 flex w-full items-center justify-between">
                <Label
                  htmlFor="isLockPermanent"
                  className="text-muted-foreground"
                >
                  Permanent Lock
                </Label>
                <div className="flex items-center">
                  <Checkbox
                    id="isLockPermanent"
                    className="h-6 w-6"
                    defaultChecked={details.isLockPermanent}
                    onCheckedChange={(value) => {
                      setValue("isLockPermanent", value as boolean);
                      if (value) {
                        setValue("lockDuration", 0);
                      }
                    }}
                  />
                </div>
                <ErrorText>{errors.isLockPermanent?.message}</ErrorText>
              </div>

              <DialogFooter>
                <Button type="submit" className="mt-4">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminLoginAttemptConfigDialog;
