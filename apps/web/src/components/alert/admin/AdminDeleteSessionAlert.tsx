/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useTRPC } from "~/trpc/react";

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  sessionId: string;
}

const AdminDeleteSessionAlert = ({ open, setOpen, sessionId }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.admin.deleteSession.mutationOptions());

  const onBlock = async () => {
    const toastId = toast.loading("Deleting session...");
    try {
      const result = await mutation.mutateAsync({
        sessionId: sessionId,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Session deleted!", { id: toastId });
        await queryClient.invalidateQueries(
          api.admin.getUserSessions.pathFilter(),
        );
        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  return (
    <AlertDialog open={open ?? false} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete this session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="default"
            disabled={mutation.isPending}
            onClick={async () => {
              await onBlock();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminDeleteSessionAlert;
