/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SubmitHandler } from "react-hook-form";
import { Dispatch, SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2, XIcon } from "lucide-react";
import moment from "moment";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

const schema = z.object({
  reason: z.string(),
  expiresAt: z.date().optional(),
});

type User =
  | RouterOutputs["admin"]["getUsers"][number]
  | NonNullable<RouterOutputs["admin"]["getUserDetails"]>;

type SchemaDialogValues = z.infer<typeof schema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  user: User;
}

const AdminBanUserDialog = ({ open, setOpen, user }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const mutation = useMutation(trpc.admin.banUser.mutationOptions());

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    register,
    formState: { errors, isSubmitting },
  } = useForm<SchemaDialogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "You have been banned.",
    },
  });

  const expiresAt = watch("expiresAt");

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setValue("expiresAt", date);
    }
  }

  function handleTimeChange(type: "hour" | "minute", value: string) {
    const newDate = new Date(expiresAt ?? new Date());

    if (type === "hour") {
      const hour = parseInt(value, 10);
      newDate.setHours(hour);
    }
    if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }

    setValue("expiresAt", newDate);
  }

  const onSubmit: SubmitHandler<SchemaDialogValues> = async (data) => {
    const toastId = toast.loading("Banning user...");
    try {
      const result = await mutation.mutateAsync({
        userId: user.id,
        reason: data.reason,
        expiresAt: data.expiresAt,
      });
      if (result.success) {
        setOpen(false);
        toast.success("User banned!", { id: toastId });
        reset();
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
        await queryClient.invalidateQueries(
          api.admin.getUserDetails.pathFilter(),
        );
        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
  };

  return (
    <Dialog
      open={open ?? false}
      onOpenChange={(e) => {
        setOpen(e);
        if (!e) {
          reset();
        }
      }}
    >
      <DialogContent
        className="max-w-xs rounded-md sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="text-left">
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>Banning user {user.email}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full">
            <Label htmlFor="reason" className="text-muted-foreground">
              Reason
            </Label>
            <div className="mt-1">
              <input
                id="password"
                type="text"
                autoComplete="reason"
                {...register("reason")}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <ErrorText>{errors.reason?.message}</ErrorText>
          </div>
          <div className="mt-4 w-full">
            <Label htmlFor="lastName" className="text-muted-foreground">
              Expires At
            </Label>
            <div className="mt-1 flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal",
                      !expiresAt && "text-muted-foreground",
                    )}
                  >
                    {expiresAt ? (
                      moment(expiresAt).format("MM/DD/YYYY HH:mm")
                    ) : (
                      <span>MM/DD/YYYY HH:mm</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="sm:flex">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={handleDateSelect}
                    />
                    <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                      <ScrollArea className="w-64 sm:w-auto">
                        <div className="flex p-2 sm:flex-col">
                          {Array.from({ length: 24 }, (_, i) => i)
                            .reverse()
                            .map((hour) => (
                              <Button
                                key={hour}
                                size="icon"
                                variant={
                                  expiresAt && expiresAt.getHours() === hour
                                    ? "default"
                                    : "ghost"
                                }
                                className="aspect-square shrink-0 sm:w-full"
                                onClick={() =>
                                  handleTimeChange("hour", hour.toString())
                                }
                              >
                                {hour}
                              </Button>
                            ))}
                        </div>
                        <ScrollBar
                          orientation="horizontal"
                          className="sm:hidden"
                        />
                      </ScrollArea>
                      <ScrollArea className="w-64 sm:w-auto">
                        <div className="flex p-2 sm:flex-col">
                          {Array.from({ length: 12 }, (_, i) => i * 5).map(
                            (minute) => (
                              <Button
                                key={minute}
                                size="icon"
                                variant={
                                  expiresAt && expiresAt.getMinutes() === minute
                                    ? "default"
                                    : "ghost"
                                }
                                className="aspect-square shrink-0 sm:w-full"
                                onClick={() =>
                                  handleTimeChange("minute", minute.toString())
                                }
                              >
                                {minute.toString().padStart(2, "0")}
                              </Button>
                            ),
                          )}
                        </div>
                        <ScrollBar
                          orientation="horizontal"
                          className="sm:hidden"
                        />
                      </ScrollArea>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {expiresAt && (
                <Button
                  type="button"
                  variant="outline"
                  className="ml-1.5 size-9"
                  onClick={() => {
                    setValue("expiresAt", undefined);
                  }}
                >
                  <XIcon className="text-muted-foreground size-5" />
                </Button>
              )}
            </div>
            <ErrorText>{errors.expiresAt?.message}</ErrorText>
          </div>
          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Banning
                </>
              ) : (
                "Ban"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBanUserDialog;
