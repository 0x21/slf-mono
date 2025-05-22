"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@fulltemplate/auth";
import { auth } from "@fulltemplate/auth/src/rsc";
import { db } from "@fulltemplate/db";

export const impersonate = async (impersonatedId: string) => {
  try {
    const session = await auth();
    if (!session) {
      return {
        success: false,
        error: "No session!",
      };
    }
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return {
        success: false,
        error: "Only admins can impersonate!",
      };
    }

    await db.impersonateToken.deleteMany({
      where: {
        impersonatingId: impersonatedId,
      },
    });

    const token = await db.impersonateToken.create({
      data: {
        impersonatingId: session.user.id,
        impersonatedId: impersonatedId,
      },
    });

    await signOut({
      redirect: false,
    });

    await signIn("impersonate", {
      impersonateId: token.id,
      redirect: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: "Invalid Credentials!",
          };
        default:
          return {
            error: "Something went wrong!",
          };
      }
    }
    return {
      error: "Something went wrong!",
    };
  }
};
