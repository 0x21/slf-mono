/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, Save, X } from "lucide-react";
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

const schema = z.object({
  ipAddress: z
    .string()
    .regex(
      /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/,
      "Invalid IPv4 address",
    ),
});

type Values = z.infer<typeof schema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminBlockedIpListDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.admin.getBlockedIps.queryOptions());
  const mutation = useMutation(api.admin.blockIp.mutationOptions());
  const mutation1 = useMutation(api.admin.unblockIp.mutationOptions());

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const {
    handleSubmit,
    setValue,
    register,
    formState: { isSubmitting, errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const blockIP: SubmitHandler<Values> = async (data) => {
    const toastId = toast.loading("Saving...");
    try {
      const result = await mutation.mutateAsync({
        ipAddress: data.ipAddress,
      });
      if (result.success) {
        toast.success("Successfully saved!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getBlockedIps.pathFilter(),
        );
        setValue("ipAddress", "");
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

  const unblockIP = async (ipAddress: string) => {
    const toastId = toast.loading("Deleting...");
    try {
      const result = await mutation1.mutateAsync({
        ipAddress: ipAddress,
      });
      if (result.success) {
        toast.success("Successfully deleted!", {
          id: toastId,
        });

        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getBlockedIps.pathFilter(),
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
            <DialogTitle>Blocked IPs</DialogTitle>
            <DialogDescription>
              Add the IP addresses that are blocked from accessing the
              application.
              <br />
              For example: 192.168.1.1
            </DialogDescription>
          </DialogHeader>

          <div className="mt-0">
            <form onSubmit={handleSubmit(blockIP)} className="space-y-2">
              <Label htmlFor="new-blocked-ip" className="text-muted-foreground">
                IP Address
              </Label>
              <div className="relative mt-2 flex flex-row items-center gap-2">
                <div className="relative flex grow items-center">
                  <input
                    id="new-blocked-ip"
                    type="text"
                    placeholder="Enter IP"
                    {...register("ipAddress")}
                    className="border-input peer placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 ps-9 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <AtSign
                      className="size-4"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size={"icon"}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-8 w-8 items-center justify-center p-1.5"
                >
                  <Save className="size-4" />
                </Button>
              </div>
              <ErrorText>{errors.ipAddress?.message}</ErrorText>
            </form>
          </div>
          <div className="w-full">
            <Label htmlFor="configs" className="text-primary">
              Blocked IPs ({data?.length})
            </Label>
            <ScrollArea className="mt-2 flex max-h-60 gap-y-2 overflow-auto">
              {data && data.length > 0 ? (
                data.map((ip, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "hover:text-primary flex flex-col justify-between rounded-md text-sm opacity-60 hover:cursor-pointer hover:opacity-100",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-primary text-sm">{ip.ipAddress}</div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          void unblockIP(ip.ipAddress);
                        }}
                      >
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  No blocked IP found.
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBlockedIpListDialog;
