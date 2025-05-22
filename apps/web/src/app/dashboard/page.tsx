"use client";

import { signOut, useSession } from "next-auth/react";

export default function Page() {
  const session = useSession();
  //   {
  //   required: true,
  // }

  return (
    <>
      dashboard
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(session, null, 2)}
      </pre>
      <button
        className=""
        onClick={async () => {
          await signOut();
        }}
      >
        log out
      </button>
    </>
  );
}
