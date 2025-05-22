import type { Result } from "@fulltemplate/common";
import { db } from "@fulltemplate/db";

export const getUserIdsFromOrganizationId = async (organizationId: string) => {
  const organization = await db.organization.findFirst({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      members: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  if (!organization) {
    return [];
  }
  return organization.members.map((member) => member.user.id);
};

export const getOrganizationMemberRole = async (
  organizationIdOrSlug: string,
  userId: string,
) => {
  const member = await db.organizationMember.findFirst({
    where: {
      organization: {
        OR: [
          {
            id: organizationIdOrSlug,
          },
          {
            slug: organizationIdOrSlug,
          },
        ],
      },
      userId: userId,
    },
    select: {
      role: true,
    },
  });

  if (!member) {
    return null;
  }

  return member.role;
};

export const ensureUserIsMemberOfOrganizationBySlug = async (
  slug: string,
  userId: string,
): Promise<
  Result<{
    name: string;
    id: string;
    members: {
      userId: string;
    }[];
  }>
> => {
  const organization = await db.organization.findFirst({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          userId: true,
        },
      },
    },
  });
  if (!organization) {
    return { success: false, error: "No organization" };
  }

  const member = organization.members.find(
    (member) => member.userId === userId,
  );

  // Not a organization member
  if (!member) {
    return { success: false, error: "Not a organization member" };
  }

  return { success: true, data: organization };
};

export const getOrganizationDetail = async (slug: string) => {
  const organization = await db.organization.findFirst({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return organization;
};
