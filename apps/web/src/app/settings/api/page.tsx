/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { ApiKeyCard } from "~/components/card/ApiKeyCard";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useTRPC } from "~/trpc/react";

export default function Page() {
  const api = useTRPC();
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(api.authApi.getApiKeys.queryOptions());
  const createMutation = useMutation(
    api.authApi.createApiKey.mutationOptions(),
  );
  const onClick = async () => {
    if (!data) {
      return;
    }
    const toastId = toast.loading("Updating...");

    try {
      const result = await createMutation.mutateAsync();
      if (result.success) {
        toast.success("Api Key created!", { id: toastId });
        await queryClient.invalidateQueries(
          api.authApi.getApiKeys.queryOptions(),
        );

        return;
      }
      toast.error(`Error: ${result.msg}`, { id: toastId });
    } catch (error) {
      toast.error("An unexpected error happened! Please try again later");
    }
  };

  useEffect(() => {
    if (!data) {
      return;
    }
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Api Tokens</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : data?.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You don't have any API tokens. Click the button below to create
              one.
            </p>
          ) : (
            data?.map((apiToken) => (
              <ApiKeyCard key={apiToken.id} {...apiToken} />
            ))
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-end border-t px-6 py-4">
        <Button
          className="hover:cursor-pointer"
          variant="default"
          onClick={onClick}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
