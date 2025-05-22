/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, MoveRight } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import toast from "react-hot-toast";

import DisableTwoFactorAuthenticationAlert from "~/components/alert/auth/DisableTwoFactorAuthenticationAlert";
import ReGenerateBackupCodesAlert from "~/components/alert/auth/ReGenerateBackupCodesAlert";
import ChangePasswordDialog from "~/components/dialog/auth/ChangePasswordDialog";
import EnableTwoFactorAuthDialog from "~/components/dialog/auth/EnableTwoFactorAuthDialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/trpc/react";

export default function Client({ providers }: { providers: string[] }) {
  const api = useTRPC();
  const { data } = useQuery(api.authUser.getAuthenticator.queryOptions());

  const mutation = useMutation(api.authUser.request2FA.mutationOptions());
  const mutation1 = useMutation(
    api.authUser.generateBackupCodes.mutationOptions(),
  );

  const [qrcode, setQrcode] = useState<string>();
  const [secret, setSecret] = useState<string>();

  const [openDisableAlert, setOpenDisableAlert] = useState(false);
  const [openEnableDialog, setOpenEnableDialog] = useState(false);
  const [openBackupCodeAlert, setOpenBackupCodeAlert] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const [openChangePasswordDialog, setOpenChangePasswordDialog] = useQueryState(
    "requires-password-change",
    parseAsBoolean,
  );

  const [requires2FA, setRequires2FA] = useQueryState(
    "requires-two-factor-auth",
    parseAsBoolean,
  );

  const onEnable = async () => {
    const toastId = toast.loading("Enabling...");
    try {
      const result = await mutation.mutateAsync();

      if (result.success) {
        toast.dismiss(toastId);
        setQrcode(result.qrcode);
        setSecret(result.secret);
        setOpenEnableDialog(true);
        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    setIs2FAEnabled(data.success);
  }, [data]);

  return (
    <>
      {openDisableAlert && providers.includes("credentials") && (
        <DisableTwoFactorAuthenticationAlert
          open={openDisableAlert}
          setOpen={setOpenDisableAlert}
        />
      )}
      {qrcode && secret && providers.includes("credentials") && (
        <EnableTwoFactorAuthDialog
          open={openEnableDialog}
          setOpen={setOpenEnableDialog}
          qrcode={qrcode}
          secret={secret}
        />
      )}
      {openChangePasswordDialog && providers.includes("credentials") && (
        <ChangePasswordDialog
          open={openChangePasswordDialog}
          setOpen={setOpenChangePasswordDialog}
        />
      )}
      {openBackupCodeAlert && (
        <ReGenerateBackupCodesAlert
          open={openBackupCodeAlert}
          setOpen={setOpenBackupCodeAlert}
        />
      )}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          {providers.includes("credentials") && (
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="change-password" className="text-base">
                  Change Password
                </Label>
                <Button
                  id="change-password"
                  type="button"
                  variant="link"
                  className=""
                  onClick={(e) => {
                    e.preventDefault();
                    void setOpenChangePasswordDialog(true);
                  }}
                >
                  <MoveRight />
                </Button>
              </div>
            </CardContent>
          )}
          {providers.includes("credentials") && (
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Label htmlFor="authenticator" className="mr-2 text-base">
                    Two-Factor Authentication
                  </Label>
                  {is2FAEnabled ? (
                    <CircleCheck className="size-4 text-green-500" />
                  ) : (
                    <CircleX className="size-4 text-red-500" />
                  )}
                </div>
                <Button
                  id="authenticator"
                  type="button"
                  variant="link"
                  className=""
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (is2FAEnabled) {
                      setOpenDisableAlert(true);
                    } else {
                      void onEnable();
                    }
                  }}
                >
                  <MoveRight />
                </Button>
              </div>
            </CardContent>
          )}
          {is2FAEnabled && (
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Label htmlFor="backup-codes" className="mr-2 text-base">
                    Re-Generate Backup Codes
                  </Label>
                </div>
                <Button
                  id="backup-codes"
                  type="button"
                  variant="link"
                  className=""
                  disabled={mutation.isPending}
                  onClick={() => {
                    setOpenBackupCodeAlert(true);
                  }}
                >
                  <MoveRight />
                </Button>
              </div>
            </CardContent>
          )}
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Label htmlFor="sessions" className="mr-2 text-base">
                  Active Sessions
                </Label>
              </div>
              <Link href="/settings/security/sessions">
                <Button id="sessions" type="button" variant="link" className="">
                  <MoveRight />
                </Button>
              </Link>
            </div>
          </CardContent>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Label htmlFor="failed-attempts" className="mr-2 text-base">
                  Failed Login Attempts
                </Label>
              </div>
              <Link href="/settings/security/failed-attempts">
                <Button
                  id="failed-attempts"
                  type="button"
                  variant="link"
                  className=""
                >
                  <MoveRight />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
