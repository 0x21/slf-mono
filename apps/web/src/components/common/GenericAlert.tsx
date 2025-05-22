import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Loader2 } from "lucide-react";

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

interface GenericAlertProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  title?: string;
  description: ReactNode;
  variant?:
    | "link"
    | "default"
    // | "positive"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost";
  actionLabel?: string;
  loadingActionLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

const GenericAlert = ({
  open,
  setOpen,
  title = "Are you absolutely sure?",
  description,
  variant = "default",
  actionLabel = "Confirm",
  loadingActionLabel = "Confirming",
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
  onCancel,
}: GenericAlertProps) => {
  return (
    <AlertDialog open={open ?? false} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {/* @ts-ignore */}
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => {
              setOpen(false);
              void onCancel?.();
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button variant={variant} disabled={isPending} onClick={onConfirm}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                {loadingActionLabel}
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GenericAlert;
