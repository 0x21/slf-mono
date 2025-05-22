"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { v4 } from "uuid";
import { z } from "zod";

import type { InvalidLoginError } from "@fulltemplate/auth/src/error";
import { isSecureContext, signIn } from "@fulltemplate/auth";
import { authErrors, getErrorText } from "@fulltemplate/auth/src/error";
import { db } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getRequestDetails } from "@fulltemplate/helpers";

import { EXPO_COOKIE_NAME } from "../constants";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

interface LoginTwoFactorSuccess {
  success: true;
  data: {
    twoFactorToken: string;
  };
}

interface LoginUserSuccess {
  success: true;
  data: {
    user: {
      id: string;
    };
    requiresPasswordChange?: boolean;
    requiresTwoFactorAuth?: boolean;
  };
}

type LoginSuccess = LoginTwoFactorSuccess | LoginUserSuccess;

interface LoginError {
  success: false;
  error: string;
}

type LoginResult = LoginSuccess | LoginError;

export const login = async (values: unknown): Promise<LoginResult> => {
  const heads = await headers();
  const reqDetails = await getRequestDetails(heads);

  let sessionToken;
  let expoCallback;

  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    await createEvent({
      category: "auth",
      type: "sign-in",
      action: "created",
      status: "failed",
      error: "validation",
      metadata: JSON.stringify(values),
      reqDetails: reqDetails,
    });
    return { success: false, error: "Unable to sign in." };
  }
  const { email, password } = validatedFields.data;
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const user = await db.user.findFirst({
      where: {
        email: email,
      },
      include: {
        config: true,
      },
    });
    if (!user) {
      return {
        success: false,
        error: "Invalid user exists!",
      };
    }
    const response: LoginUserSuccess = {
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
    if (user.config?.requiresTwoFactorAuth) {
      response.data.requiresTwoFactorAuth = true;
    }

    // console.log("HEYYY");

    const cooks = await cookies();
    const sessionCookieName = isSecureContext
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    sessionToken = cooks.get(sessionCookieName)?.value;
    expoCallback = cooks.get(EXPO_COOKIE_NAME)?.value;

    // console.log("sessionCookieName");
    // console.log(sessionCookieName);
    // console.log(sessionToken);
    // console.log(expoCallback);

    cooks.delete(EXPO_COOKIE_NAME);

    if (!expoCallback) {
      return response;
    }
    if (!sessionToken) {
      return {
        success: false,
        error: "Unable to find callback cookie.",
      };
    }
  } catch (error) {
    console.log("error");
    console.log(error);
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

          // 2fa
          if (errorCode === "enter-2fa") {
            const user = await db.user.findFirst({
              where: {
                email: email,
              },
            });
            if (!user) {
              return {
                success: false,
                error: "Invalid 2FA config!",
              };
            }
            const token = v4();
            const twoFactorToken = await db.twoFactorToken.create({
              data: {
                userId: user.id,
                token: token,
              },
            });
            return {
              success: true,
              data: {
                twoFactorToken: twoFactorToken.token,
              },
            };
          }

          const errorText = getErrorText(errorCode);
          return {
            success: false,
            error: errorText,
          };
        }
        default:
          await createEvent({
            category: "auth",
            type: "sign-in",
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

  console.log(`${expoCallback}?session_token=${sessionToken}`);
  redirect(`${expoCallback}?session_token=${sessionToken}`);
};
