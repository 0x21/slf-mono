/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
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
import { handleSignOut } from "~/lib/sign-out";
import { useTRPC } from "~/trpc/react";

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  sessionId: string;
  currentSessionId: string;
}

const DeleteSessionAlert = ({
  open,
  setOpen,
  sessionId,
  currentSessionId,
}: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.authUser.deleteSession.mutationOptions());

  const onDelete = async () => {
    const toastId = toast.loading("Logging out session...");
    try {
      const result = await mutation.mutateAsync({
        sessionId: sessionId,
      });
      if (result.success) {
        if (sessionId === currentSessionId) {
          toast.success("Session deleted! Logging out...", {
            id: toastId,
          });
          await handleSignOut();
          await queryClient.invalidateQueries(api.pathFilter());
          router.push("/");
          return;
        }
        setOpen(false);
        toast.success("Session deleted!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.authUser.getSessions.pathFilter(),
        );
        return;
      }
      // toast.error(`Something went wrong: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again later.", {
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
            Are you sure you want to log out this session? This action is
            irreversible!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={async () => {
              await onDelete();
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

export default DeleteSessionAlert;
