"use client";

import { signOut } from "next-auth/react";

import { deleteCookies } from "./actions/actions";
import { socket } from "./socket";

export const handleSignOut = async (callbackUrl?: string) => {
  try {
    localStorage.clear();
    await deleteCookies();
    await signOut({
      redirect: false,
    });
    socket.io.engine.close();
    socket.connect();
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
  } catch (error) {
    console.log(error);
  }
};
