/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Contact } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capitalize } from "es-toolkit";
import parsePhoneNumberFromString from "libphonenumber-js";
import { CircleUser, Loader2, Phone } from "lucide-react";
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

type Contact = RouterOutputs["adminPlatform"]["getContacts"][number];

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  contact: Contact;
}

const AdminContactDetailDialog = ({ open, setOpen, contact }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    api.adminPlatform.updateContactStatus.mutationOptions(),
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
        contactId: contact.id,
        status: status,
      });
      if (result.success) {
        await queryClient.invalidateQueries(
          api.adminPlatform.getContacts.pathFilter(),
        );
        setOpen(false);
        toast.success("Updated!", { id: toastId });
        setIsOpened(false);
        setIsResolving(false);
        setIsInProgress(false);
        return;
      }
      //   toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const formattedNumber = useMemo(() => {
    return (
      parsePhoneNumberFromString(contact.phone)?.formatInternational() ??
      contact.phone
    );
  }, [contact.phone]);

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
            <CircleUser className="h-10 w-10" />
            <DialogTitle className="ml-2">
              <p className="max-w-xs truncate">
                {contact.firstName} {contact.lastName}
              </p>
              <DialogDescription className="text-muted-foreground text-sm font-medium">
                {contact.email}
              </DialogDescription>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2">
            <div className="mb-1 flex items-center">
              <Phone className="text-muted-foreground mr-2 size-4" />
              <span className="text-sm">{formattedNumber}</span>
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  contact.status === "opened" &&
                    "bg-blue-50 text-blue-700 ring-blue-700/10",
                  contact.status === "in_progress" &&
                    "bg-yellow-50 text-yellow-700 ring-yellow-700/10",
                  contact.status === "resolved" &&
                    "bg-green-50 text-green-700 ring-green-700/10",
                )}
              >
                {capitalize(contact.status)}
              </span>
            </div>
            <ScrollArea className="mt-2 h-56 overflow-hidden">
              <p>{contact.message}</p>
            </ScrollArea>
          </div>
        </div>

        <h2 className="text-foreground text-md pr-4 text-right font-semibold">
          Mark as
        </h2>
        <DialogFooter className="flex w-full justify-end">
          <div className="flex flex-row gap-2">
            {contact.status !== "opened" && (
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
            {contact.status !== "in_progress" && (
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
            {contact.status !== "resolved" && (
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

export default AdminContactDetailDialog;
