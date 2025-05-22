import { db } from "@fulltemplate/db";

interface ICreateNotificationParams {
  type:
    | "organization:created"
    | "organization:updated"
    | "organization:deleted"
    | "organizations:deleted"
    | "organization:member-joined";
  title: string;
  organizationId: string;
  description: string;
  href?: string | null;
}

export const createNotification = async (params: ICreateNotificationParams) => {
  const organization = await db.organization.findFirst({
    where: {
      id: params.organizationId,
    },
    select: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!organization) {
    return;
  }

  for (const member of organization.members) {
    await db.notification.create({
      data: {
        type: params.type,
        title: params.title,
        organizationId: params.organizationId,
        description: params.description,
        href: params.href,
        isRead: false,
        userId: member.userId,
      },
    });
  }

  return;
};
