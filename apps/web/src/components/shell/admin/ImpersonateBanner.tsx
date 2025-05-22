"use client";

import dynamic from "next/dynamic";
import { VenetianMask } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { handleSignOut } from "~/lib/sign-out";

const ImpersonateBanner = () => {
  const session = useSession();

  const isImpersonating = session.data?.impersonatedById;

  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonation = async () => {
    await handleSignOut("/login");
  };

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-100 flex justify-center">
      <div className="dark:bg-background bg-background border-border pointer-events-auto m-3 w-full max-w-xs rounded-lg border opacity-75 transition-all duration-300 ease-in-out hover:opacity-90 md:max-w-xl md:opacity-30">
        <div className="flex flex-col items-center gap-4 p-3 sm:flex-row sm:justify-between sm:p-3">
          <VenetianMask className="size-6" />
          <div className="flex flex-col items-center justify-center gap-x-2 text-base md:flex-row">
            Impersonating user{" "}
            <div className="flex flex-col items-center justify-center">
              <span className="font-semibold">
                {session.data?.user.firstName} {session.data?.user.lastName}
              </span>
              <span className="text-muted-foreground text-sm">
                {session.data?.user.email}
              </span>
            </div>
          </div>
          <Button
            onClick={handleStopImpersonation}
            className="h-9 cursor-pointer rounded-full px-4 sm:mt-0"
            variant="default"
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

const DynamicEmailVerifyBanner = dynamic(
  () => Promise.resolve(ImpersonateBanner),
  { ssr: false },
);

export default DynamicEmailVerifyBanner;
