import type { GitHubProfile } from "@auth/core/providers/github";
import GithubProvider from "@auth/core/providers/github";

import { env } from "../env";

const CustomGithubProvider = () => {
  return GithubProvider({
    clientId: env.AUTH_GITHUB_ID,
    clientSecret: env.AUTH_GITHUB_SECRET,
    profile: (profile: GitHubProfile) => {
      let firstName: string | null = null;
      let lastName: string | null = null;

      if (profile.name?.includes(" ")) {
        const names = profile.name.split(" ");
        firstName = names.slice(0, names.length - 1).join(" ");
        lastName = names[names.length - 1] ?? null;
      } else {
        firstName = profile.name;
      }

      return {
        id: profile.id.toString(),
        firstName: firstName,
        lastName: lastName,
        name: profile.name,
        username: profile.login,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
  });
};

export default CustomGithubProvider;
