"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import AdminDeleteUserAlert from "~/components/alert/admin/AdminDeleteUserAlert";
import AdminUnbanUserAlert from "~/components/alert/admin/AdminUnbanUserAlert";
import AdminBanUserDialog from "~/components/dialog/admin/AdminBanUserDialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useTRPC } from "~/trpc/react";

export default function Page(props: { params: Promise<{ userId: string }> }) {
  const api = useTRPC();
  const router = useRouter();
  const params = use(props.params);

  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery(
    api.admin.getUserDetails.queryOptions({
      userId: params.userId,
    }),
  );

  return (
    <div className="grid gap-6">
      {!isLoading && data && (
        <>
          {data.config?.bannedAt ? (
            <Card>
              <CardHeader>
                <CardTitle>Unban User</CardTitle>
                <CardDescription>
                  The user's account{" "}
                  {!data.config.banExpiresAt
                    ? "is banned permanently"
                    : "is banned temporarily"}{" "}
                  and will be unbanned from accessing the system. This action is
                  reversible.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-end border-t px-6 py-4">
                <Button onClick={() => setUnbanOpen(true)}>Unban User</Button>
                <AdminUnbanUserAlert
                  open={unbanOpen}
                  setOpen={setUnbanOpen}
                  userId={params.userId}
                  email={data.email ?? ""}
                />
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ban User</CardTitle>
                <CardDescription>
                  The user's account will be banned from accessing the system.
                  This action is reversible.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-end border-t px-6 py-4">
                <Button onClick={() => setBanOpen(true)}>Ban User</Button>
                <AdminBanUserDialog
                  open={banOpen}
                  setOpen={setBanOpen}
                  user={data}
                />
              </CardFooter>
            </Card>
          )}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Delete User</CardTitle>
              <CardDescription>
                The user will be permanently deleted from the system. This
                action is cannot be irreversible.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-end border-t px-6 py-4">
              <Button onClick={() => setDeleteOpen(true)} variant="destructive">
                Delete User
              </Button>
              <AdminDeleteUserAlert
                open={deleteOpen}
                setOpen={setDeleteOpen}
                userId={params.userId}
                email={data.email ?? ""}
                onDelete={() => {
                  setDeleteOpen(false);
                  router.push("/admin/users");
                }}
              />
            </CardFooter>
          </Card>
        </>
      )}
      {isLoading &&
        Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-card border-border h-[173px] w-full rounded-lg border"
          >
            <div className="p-6">
              <div className="pb-1.5">
                <Skeleton className="h-6 w-52" />
              </div>
              <div>
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        ))}
    </div>
  );
}
