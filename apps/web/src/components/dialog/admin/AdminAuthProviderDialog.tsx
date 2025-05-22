/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import type { RouterOutputs } from "@fulltemplate/api";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { useTRPC } from "~/trpc/react";

const providers = [
  "credentials",
  "google",
  "github",
  "discord",
  "slack",
  "guest",
  "two-factor",
  "impersonate",
  "nodemailer",
] as const;

type Provider = (typeof providers)[number];

const schema = z.object({
  providers: z
    .array(z.enum(providers))
    .min(1, "At least one provider is required"),
});

type Values = z.infer<typeof schema>;

type AppConfig = RouterOutputs["admin"]["getAppConfig"];

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  appConfig: AppConfig;
}

const AdminAuthProviderDialog = ({ open, setOpen, appConfig }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(api.admin.createAuthProvider.mutationOptions());

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const {
    handleSubmit,
    setValue,
    register,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      providers: [],
    },
  });

  const onSubmit: SubmitHandler<Values> = async (data) => {
    const toastId = toast.loading("Saving...");
    try {
      const result = await mutation.mutateAsync({
        providers: data.providers,
      });
      if (result.success) {
        toast.success("Successfully saved!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        reset();
        return;
      }
      toast.error(`Error: ${result.msg}`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later", {
        id: toastId,
      });
    }
  };

  const toggleProvider = (provider: Provider) => {
    const currentProviders = watch("providers");
    if (currentProviders.includes(provider)) {
      setValue(
        "providers",
        currentProviders.filter((p) => p !== provider),
      );
      return;
    }
    setValue("providers", [...currentProviders, provider]);
  };

  useEffect(() => {
    const enabledProviders = appConfig.authProviders
      .filter(
        (item) =>
          !(item.provider === "nodemailer" && !appConfig.isEmailEnabled),
      )
      .map((item) => item.provider as Provider);
    setValue("providers", enabledProviders);
  }, [appConfig, setValue]);

  return (
    <>
      <Dialog open={open ?? false} onOpenChange={handleDialogChange}>
        <DialogContent
          className="max-w-xs rounded-md sm:max-w-[425px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader className="text-left">
              <DialogTitle>Auth Providers</DialogTitle>
              <DialogDescription>
                Configure the authentication providers
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 w-full">
              <Label htmlFor="configs" className="text-primary font-semibold">
                Providers
              </Label>
              <ScrollArea className="flex h-[200px]">
                {providers.map((provider) => (
                  <div
                    key={provider}
                    className="mr-2.5 flex justify-between py-1.5"
                  >
                    <div className="flex flex-col">
                      <Label
                        htmlFor={provider}
                        className="text-muted-foreground text-base capitalize"
                      >
                        {provider.replace("-", " ")}
                      </Label>
                    </div>
                    <Switch
                      id={provider}
                      checked={watch("providers").includes(provider)}
                      onCheckedChange={() => toggleProvider(provider)}
                      disabled={
                        provider === "nodemailer" && !appConfig.isEmailEnabled
                      }
                    />
                  </div>
                ))}
              </ScrollArea>
            </div>
            <DialogFooter className="mt-4 flex w-full justify-end">
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAuthProviderDialog;
