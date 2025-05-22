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
  slug: string;
  memberId: string;
  name: string;
}

const AdminDeleteOrganizationMemberAlert = ({
  open,
  setOpen,
  slug,
  memberId,
  name,
}: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.adminPlatform.kickOrganizationMember.mutationOptions(),
  );

  const onDelete = async () => {
    const toastId = toast.loading("Deleting member...");
    try {
      const result = await mutation.mutateAsync({
        slug: slug,
        memberId: memberId,
      });
      if (result.success) {
        if (result.organizationDeleted) {
          await queryClient.invalidateQueries(
            api.authOrganization.getOrganizations.pathFilter(),
          );
          await queryClient.invalidateQueries(
            api.adminPlatform.getOrganizations.pathFilter(),
          );
          toast.success(
            "All members deleted. Organization removed due to no members left.",
            { id: toastId },
          );
          router.push("/admin/platform/organizations");
          return;
        }
        setOpen(false);
        toast.success("Member deleted!", { id: toastId });
        await queryClient.invalidateQueries(
          api.authOrganization.getOrganizationMembers.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.adminPlatform.getOrganizationMembers.pathFilter(),
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
            Are you sure you want to delete this ruleset (
            <span className="text-foreground underline">{name}</span>)? All data
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

export default AdminDeleteOrganizationMemberAlert;
