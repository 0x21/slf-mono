/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { v4 } from "uuid";
import { z } from "zod";

import type { InvalidLoginError } from "@fulltemplate/auth/src/error";
import { getAdapter, signIn } from "@fulltemplate/auth";
import { authErrors, getErrorText } from "@fulltemplate/auth/src/error";
import { db } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getAppConfig } from "@fulltemplate/helpers/src/config";
import { getRequestDetails } from "@fulltemplate/helpers/src/request-details";

import { caller } from "~/trpc-internal/server";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  token: z.string().nullable().optional(),
});

type RegisterUserSuccess = {
  success: true;
  data: {
    user: {
      id: string;
    };
    requiresPasswordChange?: boolean;
    requiresTwoFactorAuth?: boolean;
  };
};

type RegisterSuccess = RegisterUserSuccess;

type RegisterError = {
  success: false;
  error: string;
};

type RegisterResult = RegisterSuccess | RegisterError;

export const register = async (values: unknown): Promise<RegisterResult> => {
  const heads = await headers();
  const reqDetails = await getRequestDetails(heads);

  const validatedFields = registerSchema.safeParse(values);
  if (!validatedFields.success) {
    await createEvent({
      category: "auth",
      type: "register",
      action: "created",
      status: "failed",
      error: "validation",
      metadata: JSON.stringify(values),
      reqDetails: reqDetails,
    });
    return { success: false, error: "Unable to sign in." };
  }
  const { firstName, lastName, email, password, token } = validatedFields.data;

  const appConfig = await getAppConfig();
  const adapter = getAdapter();

  // TODO create functions in auth
  // await checkIpBlocked(reqDetails?.ip);
  // await ensureRegisterEnabled(user.email);
  // await checkEmailDomainAllowed(user.email);

  if (!appConfig.isRegisterEnabled) {
    return {
      success: false,
      error:
        "We are currently unable to accept new registrations. Please try again later.",
    };
  }

  if (appConfig.isEmailDomainRestirected) {
    const invite = await db.organizationInvite.findFirst({
      where: {
        id: token ?? "",
      },
      select: {
        id: true,
      },
    });
    if (!invite) {
      const domains = await db.allowedEmailDomain.findMany();
      if (domains.length === 0) {
        await db.appConfig.update({
          where: {
            id: appConfig.id,
          },
          data: {
            isEmailDomainRestirected: false,
          },
        });
      } else {
        const emailParts = email.split("@");
        if (emailParts.length > 1) {
          const emailDomain = emailParts[1];

          const isDomainAllowed = domains.some(
            (domain) => domain.domain === emailDomain,
          );

          if (!isDomainAllowed) {
            return {
              success: false,
              error: "Your email domain is not allowed for registration.",
            };
          }
        } else {
          return {
            success: false,
            error: "Invalid email address.",
          };
        }
      }
    }
  }

  let user = await adapter.getUserByEmail!(email);
  if (!user) {
    const userCount = await db.user.count();
    const role = userCount === 0 ? "superadmin" : "user";

    user = await adapter.createUser!({
      id: v4(),
      email: email,
      firstName: firstName,
      lastName: lastName,
      name: [firstName, lastName].join(" "),
      emailVerified: null,
      role: role,
    });
  } else {
    const account = await db.account.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (account) {
      await createEvent({
        userId: user.id,
        category: "auth",
        type: "register",
        action: "created",
        status: "failed",
        error: "email-already-in-use",
        reqDetails: reqDetails,
      });
      return { success: false, error: "This email is already used!" };
    }
  }

  const result = await caller.auth.hashPassword({
    password: password,
  });
  if (!result.success) {
    await createEvent({
      userId: user.id,
      category: "auth",
      type: "register",
      action: "created",
      status: "failed",
      error: "hash-password-error",
      reqDetails: reqDetails,
    });
    return {
      success: false,
      error: "Something went wrong! Please try again later.",
    };
  }

  // const verifyOtp = v4();
  await adapter.linkAccount!({
    providerAccountId: null,
    userId: user.id,
    type: "email",
    provider: "credentials",
    password: result.data,
  });

  // await db.verificationToken.create({
  //   data: {
  //     email: input.email,
  //     token: verifyOtp,
  //     type: "email",
  //     expiresAt: moment(new Date()).add(1, "day").toDate(),
  //   },
  // });

  // if (input.token) {
  //   const invite = await db.organizationInvite.findFirst({
  //     where: {
  //       id: input.token,
  //     },
  //     select: {
  //       id: true,
  //       userId: true,
  //       organization: {
  //         select: {
  //           id: true,
  //           slug: true,
  //           name: true,
  //           notificationConfig: {
  //             select: {
  //               memberJoined: true,
  //             },
  //           },
  //           slackChannels: {
  //             select: {
  //               incomingWebhookUrl: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  //   if (!invite) {
  //     return { success: false, msg: "Invite link invalid!" };
  //   }
  //   const member = await db.organizationMember.findFirst({
  //     where: {
  //       organizationId: invite.organization.id,
  //       userId: user.id,
  //     },
  //   });
  //   if (member) {
  //     return { success: false, msg: "Already a team member!" };
  //   }
  //   await db.organizationInvite.update({
  //     where: {
  //       id: invite.id,
  //     },
  //     data: {
  //       status: "accepted",
  //       acceptEmail: input.email,
  //     },
  //   });

  //   if (invite.organization.notificationConfig?.memberJoined) {
  //     await createNotification({
  //       type: "organization:member-joined",
  //       title: "Member joined!",
  //       organizationId: invite.organization.id,
  //       description: `A new member joined to organization!`,
  //     });

  //     for (const channel of invite.organization.slackChannels) {
  //       await caller.authSlack.sendMessageToChannel({
  //         webhookUrl: channel.incomingWebhookUrl,
  //         message: `${user.firstName} ${user.lastName} joined the <${env.AUTH_URL}/dashboard/${invite.organization.slug}|organization> :tada:`,
  //       });
  //     }

  //     let members = await db.organizationMember.findMany({
  //       where: {
  //         organizationId: invite.organization.id,
  //       },
  //       select: {
  //         user: {
  //           select: {
  //             firstName: true,
  //             email: true,
  //           },
  //         },
  //       },
  //     });

  //     members = members.filter((member) => {
  //       member.user.email !== user.email;
  //     });

  //     const appConfig = await getAppConfig();
  //     if (appConfig.isEmailEnabled) {
  //       for (const member of members) {
  //         await sendMemberJoined(
  //           member.user.email!,
  //           member.user.firstName!,
  //           `${user.firstName} ${user.lastName} `,
  //           invite.organization.name,
  //           invite.organization.slug,
  //         );
  //       }
  //     }
  //   }

  //   await db.organizationMember.create({
  //     data: {
  //       organizationId: invite.organization.id,
  //       userId: user.id,
  //       role: "member",
  //       invitedByUserId: invite.userId,
  //     },
  //   });
  // }

  await createEvent({
    userId: user.id,
    category: "auth",
    type: "register",
    action: "created",
    status: "success",
    reqDetails: reqDetails,
  });

  // Send verify send this to backend endpoint
  // await caller.auth.createKafkaWork({
  //   topic: "work.email",
  //   messages: [
  //     {
  //       workerType: "verify-email",
  //       userId: user.id,
  //     },
  //   ],
  // });

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
    const response: RegisterUserSuccess = {
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
            type: "register",
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
