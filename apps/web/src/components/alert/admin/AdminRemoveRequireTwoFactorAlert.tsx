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
  userId: string;
  email: string;
}

const AdminRemoveRequireTwoFactorAlert = ({
  open,
  setOpen,
  userId,
  email,
}: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.admin.removeTwoFactorAuthRequirement.mutationOptions(),
  );

  const onBlock = async () => {
    const toastId = toast.loading("Removing...");
    try {
      const result = await mutation.mutateAsync({
        userId: userId,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Removed requirement!", { id: toastId });
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
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
            Are you sure you want to remove the requirement for two-factor
            authentication for this user (
            <span className="text-foreground underline">{email}</span>)?
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminRemoveRequireTwoFactorAlert;
