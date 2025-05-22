import { AuthError, CredentialsSignin } from "next-auth";

export type InvalidLoginReason =
  | "not-allowed-email-domain"
  | "login-disabled"
  | "register-disabled"
  | "account-banned"
  | "enter-2fa"
  | "invalid-2fa"
  | "invalid-backup-code"
  | "internal-error"
  | "blocked-ip-address"
  | (string & {});

export class InvalidLoginError extends CredentialsSignin {
  code: InvalidLoginReason;

  constructor(code: InvalidLoginReason) {
    super();
    this.code = code;
  }
}

export const getErrorText = (errorCode: InvalidLoginReason) => {
  if (errorCode === "credentials") {
    return "Sign in failed. Check the details you provided are correct.";
  } else if (errorCode === "account-banned") {
    return "Your account is banned. If you think there is a mistake, please contact us.";
  } else if (errorCode.startsWith("account-banned")) {
    const banReason = errorCode.replace("account-banned-", "");
    return `Your account is banned. If you think there is a mistake, please contact us. Reason: ${banReason}`;
  } else if (errorCode === "blocked-ip-address") {
    const banReason = errorCode.replace("account-banned-", "");
    return `Your account is banned. If you think there is a mistake, please contact us. Reason: ${banReason}`;
  } else if (errorCode === "invalid-2fa") {
    return "Invalid 2FA code!";
  } else if (errorCode === "invalid-backup-code") {
    return "Invalid backup code!";
  } else if (errorCode === "internal-error") {
    return "Internal server error! Please try again later.";
  }
  return "Unable to sign in.";
};

// https://authjs.dev/reference/core/errors
export const authErrors: Partial<Record<AuthError["type"], string>> = {
  AccessDenied:
    "Unable to sign in. If you think there is a mistake, please contact us.",
};

// https://authjs.dev/reference/core/errors#signinerror
export const authSignInErrors: Record<string, string> = {
  Signin: "Try signing with a different account. 1",
  OAuthSignin: "Try signing with a different account. 2",
  OAuthCallback: "Try signing with a different account. 3",
  OAuthCallbackError: "Try signing with a different account. 3",
  OAuthCreateAccount: "Try signing with a different account. 4",
  EmailCreateAccount: "Try signing with a different account. 5",
  Callback: "Try signing with a different account. 6",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email address.",
  CredentialsSignin:
    "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "You need to be logged to view this page.",
};
