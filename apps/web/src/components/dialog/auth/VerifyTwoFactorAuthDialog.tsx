"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "~/components/ui/input-otp";

const totpSchema = z.object({});

type TotpValues = z.infer<typeof totpSchema>;

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  totp: string;
  setTotp: Dispatch<SetStateAction<string>>;
  onSubmit2Fa: (totp: string) => void | Promise<void>;
}

const VerifyTwoFactorAuthDialog = ({
  open,
  setOpen,
  isLoading,
  totp,
  setTotp,
  onSubmit2Fa,
}: IProps) => {
  const { handleSubmit } = useForm<TotpValues>({
    resolver: zodResolver(totpSchema),
  });

  const [isBackupCode, setIsBackupCode] = useState(false);

  const onSubmit: SubmitHandler<TotpValues> = () => {
    void onSubmit2Fa(totp);
  };

  useEffect(() => {
    if (
      (isBackupCode && totp.length === 8) ||
      (!isBackupCode && totp.length === 6)
    ) {
      void handleSubmit(onSubmit)();
    }
  }, [totp]);

  return (
    <>
      <Dialog
        open={open ?? false}
        onOpenChange={(e) => {
          if (!e) {
            if (totp.length !== (isBackupCode ? 8 : 6)) {
              return;
            } else {
              setOpen(e);
              setTotp("");
            }
            return;
          }
          setOpen(e);
        }}
      >
        <DialogContent
          className="max-w-xs rounded-md sm:max-w-[425px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader className="text-left">
              <DialogTitle>
                {isBackupCode
                  ? "Use Backup Code"
                  : "Verify Two-Factor Authentication"}
              </DialogTitle>
              <DialogDescription>
                {isBackupCode
                  ? "Enter the 8-digit backup code to verify your identity."
                  : "Enter the 6-digit code from your Authenticator app to verify your identity."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-center">
              <InputOTP maxLength={isBackupCode ? 8 : 6} onChange={setTotp}>
                <InputOTPGroup>
                  {Array.from({ length: isBackupCode ? 4 : 3 }, (_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="text-primary"
                    />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator className="text-muted-foreground/80" />
                <InputOTPGroup>
                  {Array.from({ length: isBackupCode ? 4 : 3 }, (_, index) => (
                    <InputOTPSlot
                      key={index + (isBackupCode ? 4 : 3)}
                      index={index + (isBackupCode ? 4 : 3)}
                      className="text-primary"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="mt-4 text-center">
              {!isBackupCode ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsBackupCode(true)}
                >
                  Use Backup Codes
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsBackupCode(false)}
                >
                  Use Authenticator Code
                </Button>
              )}
            </div>

            <DialogFooter className="mt-4 flex w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTotp("");
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={
                  isLoading ||
                  (isBackupCode ? totp.length !== 8 : totp.length !== 6)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerifyTwoFactorAuthDialog;
