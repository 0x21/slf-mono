"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MoveRight } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import type { UserRole } from "@fulltemplate/auth/src/types";

import AdminAuthProviderDialog from "~/components/dialog/admin/AdminAuthProviderDialog";
import AdminBlockedIpListDialog from "~/components/dialog/admin/AdminBlockedIpListDialog";
import AdminLoginAttemptConfigDialog from "~/components/dialog/admin/AdminLoginAttemptConfigDialog";
import AdminRedirectListDialog from "~/components/dialog/admin/AdminRedirectListDialog";
import AdminSetAllowedDomainsDialog from "~/components/dialog/admin/AdminSetAllowedDomainsDialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/trpc/react";

const updateSchema = z.object({
  isLoginEnabled: z.boolean(),
  isRegisterEnabled: z.boolean(),
  isForgotPasswordEnabled: z.boolean(),
  isLockAccountEnabled: z.boolean(),
  isEmailDomainRestirected: z.boolean(),
  isEmailEnabled: z.boolean(),
  isSuperadminHidden: z.boolean(),
  isSuperadminRoleCloaked: z.boolean(),
  canAdminCreateUsers: z.boolean(),
  canAdminGiveSameRole: z.boolean(),
  canAdminConfigureRedirects: z.boolean(),
  canAdminConfigureAppConfig: z.boolean(),
});

type UpdateValues = z.infer<typeof updateSchema>;

export default function Client({ role }: { role: UserRole }) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.admin.getAppConfig.queryOptions());
  const mutation = useMutation(api.admin.updateAppConfig.mutationOptions());

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
  });

  const canAdminConfigureRedirects = watch("canAdminConfigureRedirects");

  const onSubmit: SubmitHandler<UpdateValues> = async (data) => {
    const toastId = toast.loading("Updating...");
    try {
      const result = await mutation.mutateAsync({
        ...data,
      });
      if (result.success) {
        toast.success("Successfully updated!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        return;
      }
      await queryClient.invalidateQueries(api.admin.getAppConfig.pathFilter());
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const [openLoginAttemptConfigsDialog, setOpenLoginAttemptConfigsDialog] =
    useState(false);
  const [openAllowedDomainsDialog, setOpenAllowedDomainsDialog] =
    useState(false);
  const [openBlockedIpListDialog, setOpenBlockedIpListDialog] = useState(false);
  const [openRedirectListDialog, setOpenRedirectListDialog] = useState(false);
  const [openAuthProvidersDialog, setOpenAuthProvidersDialog] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }
    setValue("isLoginEnabled", data.isLoginEnabled);
    setValue("isRegisterEnabled", data.isRegisterEnabled);
    setValue("isForgotPasswordEnabled", data.isForgotPasswordEnabled);
    setValue("isLockAccountEnabled", data.isLockAccountEnabled);
    setValue("isEmailDomainRestirected", data.isEmailDomainRestirected);
    setValue("isEmailEnabled", data.isEmailEnabled);
    setValue("isSuperadminHidden", data.isSuperadminHidden);
    setValue("isSuperadminRoleCloaked", data.isSuperadminRoleCloaked);
    setValue("canAdminCreateUsers", data.canAdminCreateUsers);
    setValue("canAdminGiveSameRole", data.canAdminGiveSameRole);
    setValue("canAdminConfigureRedirects", data.canAdminConfigureRedirects);
    setValue("canAdminConfigureAppConfig", data.canAdminConfigureAppConfig);
  }, [data, setValue]);

  return (
    <>
      <AdminLoginAttemptConfigDialog
        open={openLoginAttemptConfigsDialog}
        setOpen={setOpenLoginAttemptConfigsDialog}
      />
      <AdminSetAllowedDomainsDialog
        open={openAllowedDomainsDialog}
        setOpen={setOpenAllowedDomainsDialog}
      />
      <AdminBlockedIpListDialog
        open={openBlockedIpListDialog}
        setOpen={setOpenBlockedIpListDialog}
      />
      {((canAdminConfigureRedirects && role === "admin") ||
        role === "superadmin") && (
        <AdminRedirectListDialog
          open={openRedirectListDialog}
          setOpen={setOpenRedirectListDialog}
        />
      )}
      {data && (
        <AdminAuthProviderDialog
          open={openAuthProvidersDialog}
          setOpen={setOpenAuthProvidersDialog}
          appConfig={data}
        />
      )}

      <div className="flex flex-1 flex-col gap-4 pt-4">
        <div className="grid gap-6">
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <fieldset className="rounded-md border p-4">
                  <legend className="font-semibold">Authentication</legend>
                  <div className="flex items-start gap-2 py-2">
                    <Checkbox
                      id="isLoginEnabled"
                      checked={watch("isLoginEnabled")}
                      onCheckedChange={(checked) =>
                        setValue("isLoginEnabled", checked as boolean)
                      }
                    />
                    <div className="grid grow gap-2">
                      <Label htmlFor="isLoginEnabled">Login Enabled</Label>
                      {data?.isLoginEnabled && (
                        <Button
                          type="button"
                          variant="link"
                          className="text-muted-foreground m-0 h-min w-min p-0 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenAuthProvidersDialog(true);
                          }}
                        >
                          Manage Providers
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <Checkbox
                      id="isRegisterEnabled"
                      checked={watch("isRegisterEnabled")}
                      onCheckedChange={(checked) =>
                        setValue("isRegisterEnabled", checked as boolean)
                      }
                    />
                    <Label htmlFor="isRegisterEnabled">Register Enabled</Label>
                  </div>
                  {watch("isRegisterEnabled") && (
                    <div className="flex items-start gap-2 py-2">
                      <Checkbox
                        id="isEmailDomainRestirected"
                        checked={watch("isEmailDomainRestirected")}
                        onCheckedChange={(checked) =>
                          setValue(
                            "isEmailDomainRestirected",
                            checked as boolean,
                          )
                        }
                      />
                      <div className="grid grow gap-2">
                        <Label htmlFor="isEmailDomainRestirected">
                          Allow Specific Email Domains
                        </Label>
                        {data?.isEmailDomainRestirected && (
                          <Button
                            type="button"
                            variant="link"
                            className="text-muted-foreground m-0 h-min w-min p-0 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenAllowedDomainsDialog(true);
                            }}
                          >
                            Manage Domains
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 py-2">
                    <Checkbox
                      id="isForgotPasswordEnabled"
                      checked={watch("isForgotPasswordEnabled")}
                      onCheckedChange={(checked) =>
                        setValue("isForgotPasswordEnabled", checked as boolean)
                      }
                    />
                    <Label htmlFor="isForgotPasswordEnabled">
                      Forgot Password Enabled
                    </Label>
                  </div>
                </fieldset>
                <fieldset className="rounded-md border p-4">
                  <legend className="font-semibold">Security</legend>
                  <div className="flex items-start gap-2 py-2">
                    <Checkbox
                      id="isLockAccountEnabled"
                      checked={watch("isLockAccountEnabled")}
                      onCheckedChange={(checked) =>
                        setValue("isLockAccountEnabled", checked as boolean)
                      }
                    />
                    <div className="grid grow gap-2">
                      <Label htmlFor="isLockAccountEnabled">
                        Account Lock After Multiple Failed Attempts
                      </Label>
                      {data?.isLockAccountEnabled && (
                        <Button
                          type="button"
                          variant="link"
                          className="text-muted-foreground m-0 h-min w-min p-0 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenLoginAttemptConfigsDialog(true);
                          }}
                        >
                          Show
                        </Button>
                      )}
                    </div>
                  </div>
                  {role === "superadmin" && (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <Checkbox
                          id="isSuperadminHidden"
                          checked={watch("isSuperadminHidden")}
                          onCheckedChange={(checked) =>
                            setValue("isSuperadminHidden", checked as boolean)
                          }
                        />
                        <Label htmlFor="isSuperadminHidden">
                          Hide Superadmin Users
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <Checkbox
                          id="isSuperadminRoleCloaked"
                          checked={watch("isSuperadminRoleCloaked")}
                          onCheckedChange={(checked) =>
                            setValue(
                              "isSuperadminRoleCloaked",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="isSuperadminRoleCloaked">
                          Cloak Superadmin User Role
                        </Label>
                      </div>
                    </>
                  )}
                </fieldset>
                {role === "superadmin" && (
                  <fieldset className="rounded-md border p-4">
                    <legend className="font-semibold">Authorization</legend>
                    <div className="flex items-center gap-2 py-2">
                      <Checkbox
                        id="canAdminCreateUsers"
                        checked={watch("canAdminCreateUsers")}
                        onCheckedChange={(checked) =>
                          setValue("canAdminCreateUsers", checked as boolean)
                        }
                      />
                      <Label htmlFor="canAdminCreateUsers">
                        Allow Admin to Create Users
                      </Label>
                    </div>
                    {watch("canAdminCreateUsers") && (
                      <div className="flex items-center gap-2 py-2">
                        <Checkbox
                          id="canAdminGiveSameRole"
                          checked={watch("canAdminGiveSameRole")}
                          onCheckedChange={(checked) =>
                            setValue("canAdminGiveSameRole", checked as boolean)
                          }
                        />
                        <Label htmlFor="canAdminGiveSameRole">
                          Allow Admin to Give Same Role
                        </Label>
                      </div>
                    )}
                    <div className="flex items-center gap-2 py-2">
                      <Checkbox
                        id="canAdminConfigureRedirects"
                        checked={watch("canAdminConfigureRedirects")}
                        onCheckedChange={(checked) =>
                          setValue(
                            "canAdminConfigureRedirects",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor="canAdminConfigureRedirects">
                        Allow Admin to Configure Redirects
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                      <Checkbox
                        id="canAdminConfigureAppConfig"
                        checked={watch("canAdminConfigureAppConfig")}
                        onCheckedChange={(checked) =>
                          setValue(
                            "canAdminConfigureAppConfig",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor="canAdminConfigureAppConfig">
                        Allow Admin to Configure App Config
                      </Label>
                    </div>
                  </fieldset>
                )}
                <fieldset className="rounded-md border p-4">
                  <legend className="font-semibold">Other Settings</legend>
                  <div className="flex items-center gap-2 py-2">
                    <Checkbox
                      id="isEmailEnabled"
                      checked={watch("isEmailEnabled")}
                      onCheckedChange={(checked) =>
                        setValue("isEmailEnabled", checked as boolean)
                      }
                    />
                    <Label htmlFor="isEmailEnabled">
                      Enable Email Notifications
                    </Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blocked-ip-list">Blocked IP List</Label>
                    <Button
                      id="blocked-ip-list"
                      type="button"
                      variant="link"
                      onClick={() => setOpenBlockedIpListDialog(true)}
                    >
                      <MoveRight className="text-muted-foreground hover:text-primary size-5 cursor-pointer" />
                    </Button>
                  </div>
                  {((canAdminConfigureRedirects && role === "admin") ||
                    role === "superadmin") && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="redirect-list">Redirect List</Label>
                      <Button
                        id="redirect-list"
                        type="button"
                        variant="link"
                        onClick={() => setOpenRedirectListDialog(true)}
                      >
                        <MoveRight className="text-muted-foreground hover:text-primary size-5 cursor-pointer" />
                      </Button>
                    </div>
                  )}
                </fieldset>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6 py-4">
                <Button type="submit" variant="default">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
