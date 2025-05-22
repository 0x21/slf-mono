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

const ReGenerateBackupCodesAlert = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.authUser.generateBackupCodes.mutationOptions(),
  );

  const handleBackupCodes = async () => {
    const toastId = toast.loading("Generating backup codes...");

    try {
      const result = await mutation.mutateAsync();

      if (result.success) {
        toast.success("Backup codes re-generated! Please keep these codes.", {
          id: toastId,
        });
        const formattedCodes = formatBackupCodes(result.data!);
        backupCodesFile(formattedCodes);
        setOpen(false);
      } else {
        toast.error(`Error: ${result.msg}`, { id: toastId });
      }
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const formatBackupCodes = (codes: string[]) => {
    return codes.map((code, idx) => {
      return `${idx + 1}. ${code.substring(0, 4)}-${code.substring(4, 8)}`;
    });
  };

  const backupCodesFile = (formattedCodes: string[]) => {
    const header = "Two-factor backup codes\n\n";
    const body =
      "Keep your backup codes in a safe spot. These codes are the last resort for accessing your account in case you lose your password and second factors. If you cannot find these codes, you will lose access to your account.\n\n";

    const codesString = formattedCodes.join("\n");

    const fullContent = `${header}${body}${codesString}`;

    const blob = new Blob([fullContent], { type: "text/plain" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "backup-codes.txt";
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AlertDialog open={open ?? false} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to re-generate your backup codes? After this,
            you will not be able to use the old codes.
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
              await handleBackupCodes();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReGenerateBackupCodesAlert;
