"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { z } from "zod";

import type { InvalidLoginError } from "@fulltemplate/auth/src/error";
import { signIn } from "@fulltemplate/auth";
import { authErrors, getErrorText } from "@fulltemplate/auth/src/error";
import { db } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getRequestDetails } from "@fulltemplate/helpers";

const twoFactorSchema = z.object({
  twoFactorToken: z.string(),
  totp: z.string().length(6).optional(),
  // backupCode: z.string().length(8).optional(),
  remember: z.string().optional(),
});

interface TwoFactorUserSuccess {
  success: true;
  data: {
    user: {
      id: string;
    };
    requiresPasswordChange?: boolean;
  };
}

type TwoFactorSuccess = TwoFactorUserSuccess;

interface TwoFactorError {
  success: false;
  error: string;
}

type TwoFactorResult = TwoFactorSuccess | TwoFactorError;

export const twoFactor = async (values: unknown): Promise<TwoFactorResult> => {
  const heads = await headers();
  const reqDetails = await getRequestDetails(heads);

  const validatedFields = twoFactorSchema.safeParse(values);
  if (!validatedFields.success) {
    await createEvent({
      category: "auth",
      type: "two-factor",
      action: "created",
      status: "failed",
      error: "validation",
      metadata: JSON.stringify(values),
      reqDetails: reqDetails,
    });
    return { success: false, error: "Unable to sign in." };
  }
  const { twoFactorToken, totp, remember } = validatedFields.data;
  try {
    const twoFactor = await db.twoFactorToken.findFirst({
      where: {
        token: twoFactorToken,
      },
      include: {
        user: {
          include: {
            config: true,
          },
        },
      },
    });
    if (!twoFactor) {
      return {
        success: false,
        error: "Invalid 2FA config!",
      };
    }

    await signIn("two-factor", {
      twoFactorToken: twoFactorToken,
      totp: totp,
      // backupCode: backupCode,
      redirect: false,
    });

    const user = twoFactor.user;

    const response: TwoFactorUserSuccess = {
      success: true,
      data: {
        user: {
          id: user.id,
        },
      },
    };
    if (user.config?.requiresPasswordChange) {
      response.data.requiresPasswordChange = true;
    }
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "AccessDenied":
          return {
            success: false,
            error: authErrors[error.type] ?? "Unable to sign in.",
          };
        case "CredentialsSignin": {
          const err = error as InvalidLoginError;
          const errorCode = err.code;

          const errorText = getErrorText(errorCode);
          return {
            success: false,
            error: errorText,
          };
        }
        default:
          await createEvent({
            category: "auth",
            type: "two-factor",
            action: "created",
            status: "failed",
            error: `auth-error:${error.type}`,
            metadata: JSON.stringify(values),
            reqDetails: reqDetails,
          });
          return {
            success: false,
            error: authErrors[error.type] ?? "Unable to sign in.",
          };
      }
    }
    return {
      success: false,
      error: "Something went wrong!",
    };
  }
};
