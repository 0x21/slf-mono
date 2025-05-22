/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capitalize } from "es-toolkit";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import type { RouterOutputs } from "@fulltemplate/api";
import { cn } from "@fulltemplate/common";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

type Ticket =
  RouterOutputs["adminPlatform"]["getOrganizationSupportTickets"][number];

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  slug: string;
  ticket: Ticket;
}

const AdminSupportTicketDetailDialog = ({
  open,
  setOpen,
  slug,
  ticket,
}: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    api.adminPlatform.updateSupportTicket.mutationOptions(),
  );

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };
  const [isOpened, setIsOpened] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const onSubmit = async (status: "opened" | "in_progress" | "resolved") => {
    const toastId = toast.loading("Updating...");

    try {
      const result = await mutation.mutateAsync({
        ticketId: ticket.id,
        status: status,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Updated!", {
          id: toastId,
        });
        setIsInProgress(false);
        setIsResolving(false);
        setIsOpened(false);

        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizationSupportTickets.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.authOrganization.getOrganizationSupportTickets.pathFilter(),
        );
        return;
      }
      //   toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
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
        <div className="flex flex-col">
          <DialogHeader className="flex flex-row items-center">
            <Image
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-gray-200"
              src={
                ticket.member.user.image ??
                `https://avatar.vercel.sh/${ticket.member.user.email}`
              }
              alt=""
              unoptimized
            />{" "}
            <DialogTitle className="ml-2">
              <p className="max-w-xs truncate">
                {[
                  ticket.member.user.firstName,
                  ticket.member.user.lastName,
                ].join(" ")}
              </p>
              <DialogDescription className="text-muted-foreground text-sm font-medium">
                {ticket.member.user.email}
              </DialogDescription>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  ticket.status === "opened" &&
                    "bg-blue-50 text-blue-700 ring-blue-700/10",
                  ticket.status === "in_progress" &&
                    "bg-yellow-50 text-yellow-700 ring-yellow-700/10",
                  ticket.status === "resolved" &&
                    "bg-green-50 text-green-700 ring-green-700/10",
                )}
              >
                {capitalize(ticket.status)}
              </span>
            </div>
            <ScrollArea className="mt-2 h-56 overflow-hidden">
              <p>{ticket.message}</p>
            </ScrollArea>
          </div>
        </div>

        <h2 className="text-foreground text-md pr-4 text-right font-semibold">
          Mark as
        </h2>
        <DialogFooter className="flex w-full justify-end">
          <div className="flex flex-row gap-2">
            {ticket.status !== "opened" && (
              <Button
                variant="link"
                disabled={isInProgress || isResolving || isOpened}
                onClick={() => {
                  void onSubmit("opened");
                  setIsOpened(true);
                }}
                className="h-6 w-auto text-blue-500"
              >
                {isOpened ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Updating...
                  </>
                ) : (
                  "Opened"
                )}
              </Button>
            )}
            {ticket.status !== "in_progress" && (
              <Button
                variant="link"
                disabled={isInProgress || isResolving || isOpened}
                onClick={() => {
                  void onSubmit("in_progress");
                  setIsInProgress(true);
                }}
                className="h-6 w-auto text-yellow-500"
              >
                {isInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Updating...
                  </>
                ) : (
                  "In Progress"
                )}
              </Button>
            )}
            {ticket.status !== "resolved" && (
              <Button
                variant="link"
                disabled={isInProgress || isResolving || isOpened}
                onClick={() => {
                  void onSubmit("resolved");
                  setIsResolving(true);
                }}
                className="h-6 w-auto text-green-500"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Updating...
                  </>
                ) : (
                  "Resolved"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSupportTicketDetailDialog;
