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
import { useTRPC } from "~/trpc/react";

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
}

const DisableTwoFactorAuthenticationAlert = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.authUser.disable2FA.mutationOptions());

  const onDisable = async () => {
    const toastId = toast.loading("Disabling");
    try {
      const result = await mutation.mutateAsync();
      if (result.success) {
        setOpen(false);
        toast.success("Two-factor authentication disabled!", { id: toastId });
        await queryClient.invalidateQueries(
          api.authUser.getAuthenticator.pathFilter(),
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
            Are you sure you want to disable two factor authentication?
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
              await onDisable();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disabling
              </>
            ) : (
              "Disable"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DisableTwoFactorAuthenticationAlert;
