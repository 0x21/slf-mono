import NodemailerProvider from "@auth/core/providers/nodemailer";

import { db } from "@fulltemplate/db";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { GetRequestDetailsResult } from "@fulltemplate/helpers/src/request-details";

import { rememberMaxAge } from "../utils";

const CustomNodemailerProvider = (reqDetails?: GetRequestDetailsResult) => {
  return NodemailerProvider({
    // server: {
    //   host: env.EMAIL_HOST,
    //   port: parseInt(env.EMAIL_PORT, 10),
    //   secure: true,
    //   auth: {
    //     user: env.EMAIL_USER,
    //     pass: env.EMAIL_PASS,
    //   },
    //   from: env.EMAIL_USER,
    //   tls: { rejectUnauthorized: false },
    // },
    async sendVerificationRequest({
      identifier: email,
      url,
      provider: { server, from },
    }) {
      // await checkIpBanned(reqDetails?.ip);

      const user = await db.user.findFirst({
        where: {
          email: email,
        },
      });
      if (!user) {
        // TODO
        return;
      }

      const appConfig = await getAppConfig();
      if (!appConfig.isEmailEnabled) {
        // TODO
        return;
      }
      console.log("Sending email to", email);
      console.log("Email URL", url);

      // await sendVerification(email, url);
    },
    maxAge: rememberMaxAge,
  });
};

export default CustomNodemailerProvider;
