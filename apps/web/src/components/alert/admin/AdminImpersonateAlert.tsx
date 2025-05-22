/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
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
import { impersonate } from "~/lib/actions/impersonate";
import { useTRPC } from "~/trpc/react";

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  userId: string;
  email: string;
}

const AdminImpersonateAlert = ({ open, setOpen, userId, email }: IProps) => {
  const api = useTRPC();
  const session = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    api.admin.createImpersonateToken.mutationOptions(),
  );

  const onImpersonate = async () => {
    const toastId = toast.loading("Starting impersonate...");
    try {
      const result = await impersonate(userId);
      if (!result.success) {
        return;
      }
      toast.success("Successfully logged in! Redirecting...", {
        id: toastId,
      });
      setOpen(false);
      await queryClient.invalidateQueries(api.pathFilter());
      router.push("/");
      return;
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
      setOpen(false);
      return;
    }

    // const email = session.data?.user.email;
    // if (!email) {
    //   toast.error("No session email!");
    //   setOpen(false);
    //   return;
    // }

    // const toastId = toast.loading("Starting impersonate...");
    // let impersonateTokenId: string | undefined;
    // try {
    //   const result = await mutation.mutateAsync({
    //     impersonatedId: userId,
    //   });
    //   if (result.success) {
    //     impersonateTokenId = result.data;
    //     // await utils.admin.getUsers.invalidate();
    //   }
    // } catch (error) {
    //   toast.error("An unexpected error happened! Please try again later", {
    //     id: toastId,
    //   });
    //   setOpen(false);
    //   return;
    // }

    // if (!impersonateTokenId) {
    //   toast.error("No impersonation token!", {
    //     id: toastId,
    //   });
    //   setOpen(false);
    //   return;
    // }

    // toast.loading("Logging out...", {
    //   id: toastId,
    // });

    // await handleSignOut();

    // toast.loading("Logging in...", {
    //   id: toastId,
    // });

    // const result = await signIn("impersonate", {
    //   impersonateId: impersonateTokenId,
    //   redirect: false,
    // });

    // if (!result) {
    //   toast.error("Unable to sign in.", {
    //     id: toastId,
    //   });
    //   setOpen(false);
    //   return;
    // }
    // if (result.error) {
    //   toast.error(authErrors[result.error] ?? "Unable to sign in.", {
    //     id: toastId,
    //   });
    //   setOpen(false);
    //   return;
    // }
    // if (result.ok) {
    //   toast.success("Successfully logged in! Redirecting...", {
    //     id: toastId,
    //   });
    //   setOpen(false);
    //   await utils.invalidate();
    //   router.push("/");
    //   return;
    // }
    // toast.error("Unable to sign in.", {
    //   id: toastId,
    // });
    // setOpen(false);
  };

  return (
    <AlertDialog open={open ?? false} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to impersonate this user (
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
              await onImpersonate();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Impersonating
              </>
            ) : (
              "Impersonate"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminImpersonateAlert;
