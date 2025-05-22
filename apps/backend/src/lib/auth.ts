import axios from "axios";

import { Result } from "@fulltemplate/common";

import { env } from "~/env";

// TODO session type
export const getUserSession = async ({
  cookie,
  token,
}: {
  cookie: string | undefined;
  token: string | undefined;
}): Promise<
  Result<{
    id: string;
    user: {
      id: string;
    };
  } | null>
> => {
  try {
    const cookieName =
      env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

    let cookieValue;
    if (cookie) {
      cookieValue = cookie;
    } else if (token) {
      cookieValue = `${cookieName}=${token}`;
    } else {
      cookieValue = "";
    }

    const { data } = await axios.get(`${env.AUTH_URL}/api/auth/session`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieValue,
      },
      withCredentials: true,
    });
    const session = data;

    // no session in cookie
    if (!session) {
      return { success: true, data: null };
    }

    return { success: true, data: session };
  } catch (error) {
    return { success: false, error: error };
  }
};
