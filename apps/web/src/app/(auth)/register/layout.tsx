import { headers } from "next/headers";
import { redirect } from "next/navigation";

// import { sendMemberJoined } from "@fulltemplate/mail/src/send";

import { auth } from "@fulltemplate/auth/src/rsc";
import { BRAND_TITLE } from "@fulltemplate/common";
import { db } from "@fulltemplate/db";
import { createNotification } from "@fulltemplate/helpers/src/notification";

export const metadata = {
  title: `Sign Up - ${BRAND_TITLE}`,
  description: `Sign Up - ${BRAND_TITLE}`,
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const search = headersList.get("x-search");
  const searchParams = new URLSearchParams(search ?? "");
  const params = Object.fromEntries(searchParams.entries());

  const session = await auth();
  if (session) {
    if (params.invite) {
      const invite = await db.organizationInvite.findFirst({
        where: {
          id: params.invite,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          status: true,
          organization: {
            select: {
              id: true,
              slug: true,
              name: true,
              notificationConfig: {
                select: {
                  memberJoined: true,
                },
              },
            },
          },
        },
      });
      if (!invite) {
        redirect("/?invalid-invite");
      }
      if (invite.status !== "waiting") {
        redirect(
          `/dasboard/${invite.organization.id}?invite=invite-already-accepted`,
        );
      }
      const member = await db.organizationMember.findFirst({
        where: {
          organizationId: invite.organization.id,
          userId: session.user.id,
        },
      });

      if (member) {
        redirect(`/dasboard/${invite.organization.id}?invite=already-member`);
      }
      await db.organizationInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          status: "accepted",
          acceptEmail: session.user.email,
        },
      });
      await db.organizationMember.create({
        data: {
          organizationId: invite.organization.id,
          userId: session.user.id,
          role: "member",
          invitedByUserId: invite.user.id,
        },
      });

      if (invite.organization.notificationConfig?.memberJoined) {
        await createNotification({
          type: "organization:member-joined",
          organizationId: invite.organization.id,
          title: "Member joined!",
          description: `${invite.user.firstName} ${invite.user.lastName} joined the organization!`,
          href: `/dashboard/${invite.organization.slug}/settings/members`,
        });

        // for (const channel of invite.organization.slackChannels) {
        //   await caller.authSlack.sendMessageToChannel({
        //     webhookUrl: channel.incomingWebhookUrl,
        //     message: `A new member, *${invite.user.firstName} ${invite.user.lastName}*, joined the organization! <${env.NEXT_PUBLIC_APP_URL}/dashboard/${invite.organization.slug}/settings/members|Click here to manage organization members>.`,
        //   });
        // }

        // let members = await db.organizationMember.findMany({
        //   where: {
        //     organizationId: invite.organization.id,
        //   },
        //   select: {
        //     user: {
        //       select: {
        //         firstName: true,
        //         email: true,
        //       },
        //     },
        //   },
        // });

        // members = members.filter((member) => {
        //   return member.user.email !== invite.user.email;
        // });

        // const appConfig = await cacheGetAppConfig();
        // if (appConfig.isEmailEnabled) {
        //   for (const member of members) {
        //     // await sendMemberJoined(
        //     //   member.user.email!,
        //     //   member.user.firstName!,
        //     //   `${invite.user.firstName} ${invite.user.lastName} `,
        //     //   invite.organization.name,
        //     //   invite.organization.slug,
        //     // );
        //   }
        // }
      }
    }
    redirect("/dashboard");
  }
  return <>{children}</>;
}
