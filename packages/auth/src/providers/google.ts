import type { GoogleProfile } from "@auth/core/providers/google";
import GoogleProvider from "@auth/core/providers/google";

import { env } from "../env";

const CustomGoogleProvider = () => {
  return GoogleProvider({
    clientId: env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
    profile: (profile: GoogleProfile) => {
      const firstName: string = profile.given_name;
      const lastName: string | null = profile.family_name ?? null;

      return {
        id: profile.sub,
        firstName: firstName,
        lastName: lastName,
        name: profile.name,
        username: null,
        email: profile.email,
        image: profile.picture,
      };
    },
  });
};

export default CustomGoogleProvider;
