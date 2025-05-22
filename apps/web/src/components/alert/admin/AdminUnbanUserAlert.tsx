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

const AdminUnbanUserAlert = ({ open, setOpen, userId, email }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.admin.unbanUser.mutationOptions());

  const onBlock = async () => {
    try {
      const result = await mutation.mutateAsync({
        userId: userId,
      });
      if (result.success) {
        setOpen(false);
        toast.success("User ban removed!");
        await queryClient.invalidateQueries(api.admin.getUsers.pathFilter());
        await queryClient.invalidateQueries(
          api.admin.getUserDetails.pathFilter(),
        );
        return;
      }
      toast.error(`Error: ${result.msg}`);
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
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
            Are you sure you want to unban this user (
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unbanning
              </>
            ) : (
              "Unban"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminUnbanUserAlert;
