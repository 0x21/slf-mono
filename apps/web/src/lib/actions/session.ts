"use server";

import { auth } from "@fulltemplate/auth";

export const getSession = async () => {
  const session = await auth();
  return session
    ? {
        id: session.id,
      }
    : null;
};
