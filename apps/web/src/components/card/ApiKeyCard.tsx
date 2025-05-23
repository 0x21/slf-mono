import { useState } from "react";
import { Tooltip } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clipboard } from "lucide-react";
import { toast } from "react-hot-toast";

import { cn } from "@fulltemplate/common";

import DateText from "~/components/common/DateText";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/trpc/react";

export interface ApiKey {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  token: string;
}

export function ApiKeyCard({ id, createdAt, expiresAt, token }: ApiKey) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const deleteMutation = useMutation(
    api.authApi.deleteApiKey.mutationOptions({
      onSuccess: async () => {
        toast.success("API key deleted.");
        await queryClient.invalidateQueries(
          api.authApi.getApiKeys.queryOptions(),
        );
      },
      onError: () => {
        toast.error("Error deleting API key.");
      },
    }),
  );

  const handleDelete = () => {
    deleteMutation.mutate({ id });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="border-muted bg-muted/50">
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Tooltip title={"Click to copy"} arrow placement="top">
              <div
                onClick={handleCopy}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="flex items-center gap-1"
              >
                <Label className="text-primary text-sm hover:cursor-pointer hover:underline">
                  {token}
                </Label>
                <Clipboard className={cn(show ? "" : "hidden")} size={14} />
              </div>
            </Tooltip>
            <div className="flex gap-4">
              <div className="flex gap-1">
                <Label className="text-muted-foreground text-xs font-medium">
                  Created
                </Label>
                <DateText
                  className="text-xs"
                  date={createdAt}
                  textType="short"
                />
              </div>
              <div className="flex gap-1">
                <Label className="text-muted-foreground text-xs font-medium">
                  Expires
                </Label>
                <DateText
                  className="text-xs"
                  date={expiresAt}
                  textType="short"
                />
              </div>
            </div>
          </div>
          <Button
            variant="default"
            className="bg-primary hover:cursor-pointer hover:bg-none"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting" : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
