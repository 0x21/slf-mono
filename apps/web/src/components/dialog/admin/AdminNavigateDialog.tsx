import type { Dispatch, SetStateAction } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip } from "@mui/material";
import { ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import pluralize from "pluralize";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { validate } from "uuid";
import { z } from "zod";

import type { OnlineUser } from "@fulltemplate/socket";
import { cn } from "@fulltemplate/common";

import ErrorText from "~/components/common/ErrorText";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
import { socket } from "~/lib/socket";

const navigateDialogSchema = z.object({
  url: z.string().min(1, "Url cannot be empty"),
  openNewTab: z.boolean().default(false),
});

type AdminNavigateDialogValues = z.infer<typeof navigateDialogSchema>;

interface IProps {
  open: boolean | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onlineTabs: OnlineUser[];
}

const AdminNavigateDialog = ({ open, setOpen, onlineTabs }: IProps) => {
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const [selectedConnIds, setSelectedConnIds] = useState<string[]>([]);

  const toggleSelection = (connId: string) => {
    setSelectedConnIds((prev) =>
      prev.includes(connId)
        ? prev.filter((id) => id !== connId)
        : [...prev, connId],
    );
  };

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<AdminNavigateDialogValues>({
    resolver: zodResolver(navigateDialogSchema),
  });

  const reloadTabs = async (connIds: string[]) => {
    for (const connId of connIds) {
      try {
        const result = await socket.emitWithAck("adminReloadTab", {
          connectionId: connId,
        });
        if (!result.success) {
          toast.error("Unexpected error occurred");
          return;
        }
        if (!result.data.success) {
          toast.error(result.data.error);
          return;
        }
        toast.success("Tab reloaded successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to reload tab!");
      }
    }
  };

  const closeTabs = async (connIds: string[]) => {
    for (const connId of connIds) {
      try {
        const result = await socket.emitWithAck("adminCloseTab", {
          connectionId: connId,
        });
        if (!result.success) {
          toast.error("Unexpected error occurred");
          return;
        }
        if (!result.data.success) {
          toast.error(result.data.error);
          return;
        }
        toast.success("Tab closed successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to close tab!");
      }
    }
  };

  const onSubmit: SubmitHandler<AdminNavigateDialogValues> = async (data) => {
    for (const connId of selectedConnIds) {
      try {
        const result = await socket.emitWithAck("adminNavigateTab", {
          connectionId: connId,
          url: data.url,
          openNewTab: data.openNewTab,
        });
        if (!result.success) {
          toast.error("Unexpected error occurred");
          return;
        }
        if (!result.data.success) {
          toast.error(result.data.error);
          return;
        }
        toast.success("Tab navigated successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to navigate tab!");
      }
    }
    reset();
  };

  return (
    <Dialog open={open ?? false} onOpenChange={handleDialogChange}>
      <DialogContent
        className="max-w-xs rounded-md sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="text-left">
          <DialogTitle>Tabs</DialogTitle>
          <DialogDescription>
            Manage {onlineTabs[0]?.user?.email}'s tabs
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          <div className="flex flex-row items-center justify-between">
            <Label>Active Tabs</Label>
          </div>
          <ScrollArea className="mt-2 max-h-60 overflow-auto">
            {onlineTabs.map((tab) => (
              <div
                key={tab.connectionId}
                className={cn(
                  "hover:text-primary flex items-center gap-1 px-2 py-2 text-sm opacity-60 hover:cursor-pointer hover:opacity-100",
                  selectedConnIds.includes(tab.connectionId) &&
                    "bg-muted text-primary opacity-100",
                  tab.focus
                    ? "border-l-2 border-green-500"
                    : "border-l-2 border-gray-800",
                )}
                onClick={() => toggleSelection(tab.connectionId)}
              >
                <div>
                  <div>
                    <span
                      className={
                        tab.focus ? "text-green-500" : "text-muted-foreground"
                      }
                    >
                      {tab.focus ? "Focused" : "Unfocused"}
                    </span>
                    <div className="flex gap-1 text-xs">
                      Path:
                      <Tooltip title={tab.pathname} placement="top" arrow>
                        <span className="max-w-[100px] break-words whitespace-normal sm:max-w-[250px]">
                          {tab.pathname
                            ?.split("/")
                            .map((segment) =>
                              validate(segment) ? "..." : segment,
                            )
                            .join("/")}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex flex-col gap-1">
                  <div className="flex items-center justify-end text-xs font-semibold">
                    {tab.connectionId.slice(0, 8)}
                  </div>
                  {selectedConnIds.includes(tab.connectionId) ? (
                    <div className="flex flex-row gap-1">
                      <Tooltip title={"Reload Tab"} placement="top" arrow>
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center p-1.5"
                          onClick={(e) => {
                            e.preventDefault();
                            void reloadTabs([tab.connectionId]);
                          }}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        title={"Open in a new tab"}
                        placement="top"
                        arrow
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center p-1.5"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(
                              tab.pathname,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip title={"Close Tab"} placement="top" arrow>
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center p-1.5"
                          onClick={(e) => {
                            e.preventDefault();
                            void closeTabs([tab.connectionId]);
                          }}
                        >
                          <X className="size-4 text-red-500" />
                        </Button>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                      >
                        <ExternalLink className="size-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled
                        className="flex h-8 w-8 items-center justify-center p-1.5"
                      >
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="mt-4 flex w-full items-center justify-between">
            <Label htmlFor="selectAll" className="text-muted-foreground">
              Select All
            </Label>
            <Checkbox
              id="selectAll"
              className="h-5 w-5"
              checked={selectedConnIds.length === onlineTabs.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedConnIds(onlineTabs.map((tab) => tab.connectionId));
                } else {
                  setSelectedConnIds([]);
                }
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-row justify-between">
            <Label className="mt-4">
              Navigate {selectedConnIds.length}{" "}
              {pluralize("Tab", selectedConnIds.length)}
            </Label>
            <div className="flex flex-row gap-1">
              <Tooltip title={"Reload Tabs"} placement="top" arrow>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex h-8 w-8 items-center justify-center p-1.5"
                  disabled={selectedConnIds.length === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    void reloadTabs(selectedConnIds);
                  }}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </Tooltip>
              <Tooltip title={"Close Tabs"} placement="top" arrow>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex h-8 w-8 items-center justify-center p-1.5"
                  disabled={selectedConnIds.length === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    void closeTabs(selectedConnIds);
                  }}
                >
                  <X className="size-4 text-red-500" />
                </Button>
              </Tooltip>
            </div>
          </div>
          <div className="mt-2 w-full">
            <Label htmlFor="url" className="text-muted-foreground">
              Url
            </Label>
            <div className="relative mt-1">
              <input
                id="url"
                type={"text"}
                autoComplete="current-password"
                {...register("url")}
                disabled={selectedConnIds.length === 0}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
              <ErrorText>{errors.url?.message}</ErrorText>
            </div>
          </div>
          <div className="mt-4 flex w-full items-center justify-between">
            <Label htmlFor="openNewTab" className="text-muted-foreground">
              Open New Tab
            </Label>
            <Checkbox
              id="openNewTab"
              className="h-5 w-5"
              disabled={selectedConnIds.length === 0}
              onCheckedChange={(value) =>
                setValue("openNewTab", value as boolean)
              }
            />
            <ErrorText>{errors.openNewTab?.message}</ErrorText>
          </div>
          <DialogFooter className="mt-4 flex w-full justify-end">
            <Button
              type="submit"
              variant="default"
              className="h-8"
              disabled={isSubmitting || selectedConnIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Navigating
                </>
              ) : (
                "Navigate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNavigateDialog;
