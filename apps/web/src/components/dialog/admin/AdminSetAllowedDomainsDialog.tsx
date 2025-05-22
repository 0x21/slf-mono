/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { cn } from "@fulltemplate/common";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTRPC } from "~/trpc/react";

const schema = z.object({
  domain: z
    .string()
    .regex(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/, "Invalid domain format"),
});

type Values = z.infer<typeof schema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminSetAllowedDomainsDialog = ({ open, setOpen }: IProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    api.admin.getAllowedDomains.queryOptions(),
  );
  const mutation = useMutation(api.admin.createAllowedDomain.mutationOptions());
  const mutation1 = useMutation(
    api.admin.deleteAllowedDomain.mutationOptions(),
  );

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const {
    handleSubmit,
    setValue,
    register,
    formState: { isSubmitting, errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const saveDomain: SubmitHandler<Values> = async (data) => {
    const toastId = toast.loading("Saving...");
    try {
      const result = await mutation.mutateAsync({
        domain: data.domain,
      });
      if (result.success) {
        toast.success("Successfully saved!", {
          id: toastId,
        });
        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getAllowedDomains.pathFilter(),
        );
        setValue("domain", "");
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

  const deleteDomain = async (domain: string) => {
    const toastId = toast.loading("Deleting...");
    try {
      const result = await mutation1.mutateAsync({
        domain: domain,
      });
      if (result.success) {
        toast.success("Successfully deleted!", {
          id: toastId,
        });

        await queryClient.invalidateQueries(
          api.admin.getAppConfig.pathFilter(),
        );
        await queryClient.invalidateQueries(
          api.admin.getAllowedDomains.pathFilter(),
        );

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

  return (
    <>
      <Dialog open={open ?? false} onOpenChange={handleDialogChange}>
        <DialogContent
          className="max-w-xs rounded-md sm:max-w-[425px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader className="text-left">
            <DialogTitle>Domains</DialogTitle>
            <DialogDescription>
              Add the domains that are allowed to register with the application.
              <br />
              For example: fulltemplate.site
            </DialogDescription>
          </DialogHeader>

          <div className="mt-0">
            <form onSubmit={handleSubmit(saveDomain)} className="space-y-2">
              <Label htmlFor="new-domain">New Domain</Label>
              <div className="relative mt-2 flex flex-row items-center gap-2">
                <div className="relative flex grow items-center">
                  <Input
                    id="new-domain"
                    className="peer w-full ps-9"
                    placeholder="Enter domain"
                    {...register("domain")}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <AtSign
                      className="size-4"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size={"icon"}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-8 w-8 items-center justify-center p-1.5"
                >
                  <Save className="size-4 text-green-500" />
                </Button>
              </div>
              <ErrorText>{errors.domain?.message}</ErrorText>
            </form>
          </div>
          <div className="w-full">
            <Label htmlFor="configs" className="text-primary">
              Allowed Domains
            </Label>
            <ScrollArea className="mt-2 flex max-h-60 gap-y-2 overflow-auto">
              {data && data.length > 0 ? (
                data.map((domain, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "hover:text-primary flex flex-col justify-between rounded-md text-sm opacity-60 hover:cursor-pointer hover:opacity-100",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-primary text-sm">{domain}</div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          void deleteDomain(domain);
                        }}
                      >
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  No allowed domains found.
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSetAllowedDomainsDialog;
