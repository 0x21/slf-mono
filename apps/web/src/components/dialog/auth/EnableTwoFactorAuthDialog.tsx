"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import Image from "next/image";
import { Tooltip } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@fulltemplate/common";

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
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

interface IProps {
  open: boolean | null;
  setOpen:
    | Dispatch<SetStateAction<boolean | null>>
    | Dispatch<SetStateAction<boolean>>;
  qrcode: string;
  secret: string;
}

const EnableTwoFactorAuthDialog = ({
  open,
  setOpen,
  qrcode,
  secret,
}: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.authUser.enable2FA.mutationOptions());
  const mutation1 = useMutation(
    api.authUser.generateBackupCodes.mutationOptions(),
  );

  const [otp, setOtp] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading("Verifying...");

    try {
      const result = await mutation.mutateAsync({
        token: otp,
      });

      if (result.success) {
        toast.success("2FA enabled!", { id: toastId });
        await handleBackupCodes(toastId);
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

  const handleBackupCodes = async (toastId: string) => {
    toast.loading("Generating backup codes...", { id: toastId });

    try {
      const result = await mutation1.mutateAsync();

      if (result.success) {
        toast.success("Backup codes generated! Please keep these codes.", {
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
    <Dialog open={open ?? false} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-xs rounded-md sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enhance your account security by enabling 2FA. Follow the steps
              below to set it up with your Authenticator app.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            {showSecret ? (
              <>
                <div className="text-primary mt-2 text-sm font-bold">
                  Secret Key
                </div>
                <div className="flex max-w-[280px] items-center sm:max-w-[375px]">
                  <ScrollArea className="text-muted-foreground mr-2 overflow-auto whitespace-nowrap">
                    {isVisible ? secret : secret.replace(/./g, "*")}
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {!isVisible && (
                    <Tooltip title="See secret key" placement="top" arrow>
                      <Button
                        variant="outline"
                        size="icon"
                        className="mr-2 flex h-8 w-8 items-center justify-center p-1.5"
                        onClick={() => setIsVisible(true)}
                      >
                        <Eye className="h-5 w-5 text-gray-600" />
                      </Button>
                    </Tooltip>
                  )}

                  {isVisible && (
                    <Tooltip title="Hide secret key" placement="top" arrow>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                        onClick={() => setIsVisible(false)}
                      >
                        <EyeOff className="h-5 w-5 text-gray-600" />
                      </Button>
                    </Tooltip>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="relative flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 p-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(secret);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <div
                      className={cn(
                        "transition-all",
                        copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                      )}
                    >
                      <Check
                        className="size-4 text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={cn(
                        "absolute transition-all hover:cursor-pointer",
                        copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                      )}
                    >
                      <Tooltip title="Copy to clipboard" placement="top" arrow>
                        <Copy
                          className="text-muted-foreground size-4"
                          aria-hidden="true"
                        />
                      </Tooltip>
                    </div>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <Image
                  width={16}
                  height={16}
                  src={qrcode}
                  alt="2FA QR Code"
                  className="h-36 w-36 lg:h-48 lg:w-48"
                />
              </div>
            )}
            <div className="mb-2 flex items-center justify-center">
              <Button
                type="button"
                variant="link"
                className="h-auto w-auto p-0 text-sm"
                onClick={() => setShowSecret((prev) => !prev)}
              >
                {showSecret ? "Try again scan" : "Unable to scan?"}
              </Button>
            </div>

            <div className="rounded-md text-white">
              <p className="text-primary mb-2 text-base font-bold">
                Use an authenticator app of your choice
              </p>
              <ul className="text-primary mb-4 list-inside list-none text-sm">
                {!showSecret && (
                  <li className="mb-2">
                    <span className="font-bold">Step 1:</span> Scan the QR Code
                    with your Authenticator app.
                  </li>
                )}
                {showSecret && (
                  <li className="mb-2">
                    <span className="font-bold">Step 1:</span> Copy the secret
                    and enter the code your authenticator app.
                  </li>
                )}
                <li className="mb-2">
                  <span className="font-bold">Step 2:</span> Enter the code
                  below from your app.
                </li>
              </ul>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  onChange={(e) => {
                    setOtp(e);
                  }}
                >
                  <InputOTPGroup>
                    {[0, 1, 2].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="text-primary"
                      />
                    ))}
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-muted-foreground/80" />
                  <InputOTPGroup>
                    {[3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="text-primary"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button
              type="submit"
              variant="default"
              disabled={mutation.isPending || otp.length !== 6}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enabling...
                </>
              ) : (
                "Enable"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnableTwoFactorAuthDialog;
