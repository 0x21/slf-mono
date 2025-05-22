import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";

import type { RouterOutputs } from "@fulltemplate/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

type Feedback = RouterOutputs["adminPlatform"]["getFeedbacks"][number];

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  feedback: Feedback;
}

const AdminFeedbackDetailDialog = ({ open, setOpen, feedback }: IProps) => {
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
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
                feedback.user.image ??
                `https://avatar.vercel.sh/${feedback.user.email}`
              }
              alt=""
              unoptimized
            />{" "}
            <DialogTitle className="ml-2">
              <p className="max-w-xs truncate">
                {[feedback.user.firstName, feedback.user.lastName].join(" ")}
              </p>
              <DialogDescription className="text-muted-foreground text-sm font-medium">
                {feedback.user.email}
              </DialogDescription>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2">
            <p className="font-semibold">
              Reason:{" "}
              <span className="font-normal">{feedback.reason}</span>{" "}
            </p>
            <ScrollArea className="mt-2 h-56 overflow-hidden">
              <p>{feedback.message}</p>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminFeedbackDetailDialog;
