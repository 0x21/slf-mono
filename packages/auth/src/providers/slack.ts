import type { SlackProfile } from "@auth/core/providers/slack";
import SlackProvider from "@auth/core/providers/slack";

import { env } from "../env";

const CustomSlackProvider = SlackProvider({
  clientId: env.AUTH_SLACK_CLIENT_ID,
  clientSecret: env.AUTH_SLACK_CLIENT_SECRET,
  profile: (profile: SlackProfile) => {
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (profile.name.includes(" ")) {
      const names = profile.name.split(" ");
      firstName = names.slice(0, names.length - 1).join(" ");
      lastName = names[names.length - 1] ?? null;
    } else {
      firstName = profile.name;
    }

    return {
      id: profile.sub,
      firstName: firstName,
      lastName: lastName,
      name: profile.name,
      username: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
});

export default CustomSlackProvider;
