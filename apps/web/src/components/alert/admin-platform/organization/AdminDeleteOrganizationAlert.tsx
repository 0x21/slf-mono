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
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  slug: string;
}

const AdminDeleteOrganizationAlert = ({ open, setOpen, slug }: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.adminPlatform.deleteOrganization.mutationOptions(),
  );

  const onDeleteUser = async () => {
    const toastId = toast.loading("Deleting organization...");
    try {
      const result = await mutation.mutateAsync({
        slug: slug,
      });
      if (result.success) {
        setOpen(false);
        toast.success("Organization deleted!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizations.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.authOrganization.getOrganizations.pathFilter(),
        );
        return;
      }
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete this organization (
            <span className="text-foreground underline">{slug}</span>)? All data
            associated will be deleted. This action is irreversible!
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
              await onDeleteUser();
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

export default AdminDeleteOrganizationAlert;
