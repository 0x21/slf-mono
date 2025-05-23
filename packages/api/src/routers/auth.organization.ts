/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { kebabCase } from "es-toolkit/string";
import moment from "moment";
import { v4 } from "uuid";
import { z } from "zod";

import {
  createNotification,
  createOrganizationEvent,
  getAppConfig,
} from "@fulltemplate/helpers";

// import { sendMemberJoined } from "@fulltemplate/mail/src/send";

import {
  protectedOrganizationOwnerProcedure,
  protectedOrganizationProcedure,
  protectedProcedure,
} from "../trpc";

export const authOrganizationRouter = {
  getOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.organizationMember.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            image: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return members.map((member) => member.organization);
  }),
  getOrganizationModules: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const modules = await ctx.db.organizationModule.findMany({
        where: {
          organization: {
            slug: input.slug,
          },
        },
        select: {
          name: true,
        },
      });

      return modules.map((m) => m.name);
    }),
  getOrganizationId: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
        },
      });
      return organization;
    }),
  getOrganizationMembers: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          members: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
              role: true,
              createdAt: true,
            },
          },
        },
      });
      return organization?.members ?? [];
    }),
  getOrganizationMemberRole: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const member = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: ctx.organization.id,
          userId: userId,
        },
        select: {
          role: true,
        },
      });

      return member?.role;
    }),
  changeMemberRole: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        memberId: z.string(),
        role: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationMember.update({
        where: {
          id: input.memberId,
        },
        data: {
          role: input.role,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "organization",
        type: "member",
        action: "role-changed",
        status: "success",
      });

      return {
        success: true,
      };
    }),
  transferOwnership: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        transferedMemberId: z.string(),
      }),
    )
    .mutation(async ({ ctx }) => {
      const member = await ctx.db.organizationMember.findFirst({
        where: {
          id: ctx.organizationMember.id,
        },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!member) {
        await createOrganizationEvent({
          organizationId: ctx.organization.id,
          memberId: ctx.organizationMember.id,
          category: "organization",
          type: "member",
          action: "role-changed",
          status: "failed",
          error: "no-member",
        });

        return {
          success: false,
          msg: "No member!",
        };
      }

      await ctx.db.organizationMember.update({
        where: {
          id: ctx.organizationMember.id,
        },
        data: {
          role: "member",
        },
      });

      await ctx.db.organizationMember.update({
        where: {
          id: member.id,
        },
        data: {
          role: "owner",
        },
      });

      await createOrganizationEvent({
        organizationId: member.organizationId,
        memberId: member.id,
        category: "organization",
        type: "member",
        action: "role-changed",
        status: "success",
        metadata: `ownership-transferred-from-${ctx.organizationMember.id}-to-${member.id}`,
      });

      return {
        success: true,
      };
    }),
  getOrganizationNotificationPreferences: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          notificationConfig: true,
        },
      });

      if (!organization) {
        return {
          success: false,
          msg: "No organization found!",
        };
      }

      if (!organization.notificationConfig) {
        const newConfig = await ctx.db.organizationNotificationConfig.create({
          data: {
            organizationId: organization.id,
          },
        });

        return {
          success: true,
          config: newConfig,
        };
      }

      return {
        success: true,
        config: organization.notificationConfig,
      };
    }),
  getOrganizationInvites: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          invites: {
            select: {
              id: true,
              status: true,
              email: true,
              createdAt: true,
              expiresAt: true,
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      });
      return organization?.invites ?? [];
    }),
  getOrganizationEvents: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.organizationEvent.findMany({
        where: {
          organization: {
            slug: input.slug,
          },
          memberId: {
            not: null,
          },
        },
        select: {
          id: true,
          member: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  name: true,
                  username: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          severity: true,
          source: true,
          category: true,
          type: true,
          action: true,
          status: true,
          metadata: true,
          error: true,
          updatedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 500,
      });

      return events;
    }),
  getOrganizationInvitesByUser: protectedProcedure.query(async ({ ctx }) => {
    const now = moment(new Date());

    const email = ctx.session.user.email!;

    await ctx.db.organizationInvite.updateMany({
      where: {
        email: email,
        status: "waiting",
        expiresAt: {
          lte: now.toDate(),
        },
      },
      data: {
        status: "expired",
      },
    });

    const invites = await ctx.db.organizationInvite.findMany({
      where: {
        email: email,
        status: "waiting",
        expiresAt: {
          gte: now.toDate(),
        },
      },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invites;
  }),
  acceptInvitation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      const invite = await ctx.db.organizationInvite.findFirst({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          status: true,
          userId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              notificationConfig: {
                select: {
                  memberJoined: true,
                },
              },
              slackChannels: {
                select: {
                  incomingWebhookUrl: true,
                },
              },
            },
          },
          expiresAt: true,
        },
      });

      if (!invite) {
        return {
          success: false,
          msg: "No invitation",
        };
      }

      if (invite.status === "accepted") {
        return {
          success: false,
          msg: "Invitation already accepted.",
        };
      }

      if (invite.status === "expired") {
        await createOrganizationEvent({
          organizationId: invite.organization.id,
          category: "organization",
          type: "invite",
          action: "expired",
          status: "failed",
          metadata: `invite:${invite.id}`,
          error: "invitation-expired",
        });

        return {
          success: false,
          msg: "Invitation expired.",
        };
      }

      if (invite.status === "waiting") {
        await ctx.db.organizationInvite.update({
          where: {
            id: invite.id,
          },
          data: {
            status: "accepted",
            acceptEmail: user.email,
          },
        });

        if (invite.organization.notificationConfig?.memberJoined) {
          await createNotification({
            type: "organization:member-joined",
            title: "Member joined!",
            organizationId: invite.organization.id,
            description: `${user.firstName} ${user.lastName} joined the organization.`,
          });

          for (const channel of invite.organization.slackChannels) {
            // await caller.authSlack.sendMessageToChannel({
            //   webhookUrl: channel.incomingWebhookUrl,
            //   message: `${user.firstName} ${user.lastName} joined the <${env.AUTH_URL}/dashboard/${invite.organization.slug}|organization> :tada:`,
            // });
          }

          let members = await ctx.db.organizationMember.findMany({
            where: {
              organizationId: invite.organization.id,
            },
            select: {
              user: {
                select: {
                  firstName: true,
                  email: true,
                },
              },
            },
          });

          members = members.filter((member) => {
            return member.user.email !== user.email;
          });

          const appConfig = await getAppConfig();
          if (appConfig.isEmailEnabled) {
            for (const member of members) {
              // await sendMemberJoined(
              //   member.user.email!,
              //   member.user.firstName!,
              //   `${user.firstName} ${user.lastName} `,
              //   invite.organization.name,
              //   invite.organization.slug,
              // );
            }
          }
        }

        const newMember = await ctx.db.organizationMember.create({
          data: {
            organizationId: invite.organization.id,
            userId: user.id,
            role: "member",
            invitedByUserId: invite.userId,
          },
        });

        await createOrganizationEvent({
          organizationId: invite.organization.id,
          memberId: newMember.id,
          category: "organization",
          type: "invite",
          action: "accepted",
          status: "success",
        });

        return {
          success: true,
        };
      }

      return {
        success: false,
        msg: "Unknown invitation status.",
      };
    }),
  rejectInvitation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.organizationInvite.findFirst({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          organizationId: true,
          status: true,
          expiresAt: true,
        },
      });

      if (!invite) {
        return {
          success: false,
          msg: "No invitation",
        };
      }

      if (invite.status === "accepted") {
        return {
          success: false,
          msg: "Invitation already accepted.",
        };
      }

      if (invite.status === "expired") {
        await createOrganizationEvent({
          organizationId: invite.organizationId,
          category: "organization",
          type: "invite",
          action: "expired",
          status: "failed",
          metadata: `invite:${invite.id}`,
          error: "invitation-expired",
        });

        return {
          success: false,
          msg: "Invitation expired.",
        };
      }

      if (invite.status === "waiting") {
        await ctx.db.organizationInvite.update({
          where: {
            id: invite.id,
          },
          data: {
            status: "rejected",
          },
        });
        return {
          success: true,
        };
      }

      return {
        success: false,
        msg: "Unknown invitation status.",
      };
    }),
  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const slug = `${kebabCase(input.name.toLowerCase())}-${v4().substring(0, 8)}`;
      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug: slug,
          members: {
            create: {
              userId: userId,
              role: "owner",
            },
          },
        },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      });

      await ctx.db.organizationNotificationConfig.create({
        data: {
          organizationId: organization.id,
        },
      });

      return {
        success: true,
        data: {
          organization: {
            slug: organization.slug,
            name: organization.name,
          },
        },
      };
    }),
  updateOrganizationName: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          notificationConfig: {
            select: {
              organizationUpdated: true,
            },
          },
          slackChannels: {
            select: {
              incomingWebhookUrl: true,
            },
          },
        },
      });

      await ctx.db.organization.update({
        where: {
          id: ctx.organization.id,
        },
        data: {
          name: input.name,
        },
      });

      if (organization?.notificationConfig?.organizationUpdated) {
        await createNotification({
          type: "organization:updated",
          title: "Organization name changed!",
          organizationId: ctx.organization.id,
          description: `Organization name has been changed`,
        });

        for (const channel of organization.slackChannels) {
          // await caller.authSlack.sendMessageToChannel({
          //   webhookUrl: channel.incomingWebhookUrl,
          //   message: `Organization name has been changed to ${input.name}.`,
          // });
        }
      }

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "organization",
        action: "updated",
        status: "success",
        metadata: `name:${input.name}`,
      });

      return {
        success: true,
        data: {
          organization: {
            name: input.name,
          },
        },
      };
    }),
  updateOrganizationSlug: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        newSlug: z
          .string()
          .min(1, { message: "Slug must contain at least 1 character" })
          .max(16, { message: "Slug must not exceed 16 characters" })
          .regex(/^[a-z0-9-]+$/, {
            message:
              "Only lowercase alphanumeric characters and hyphens are allowed",
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedNewSlug = input.newSlug.toLowerCase();

      const slugExists = await ctx.db.organization.findFirst({
        where: {
          slug: normalizedNewSlug,
        },
      });

      if (slugExists) {
        await createOrganizationEvent({
          organizationId: ctx.organization.id,
          memberId: ctx.organizationMember.id,
          category: "modal",
          type: "organization",
          action: "updated",
          status: "failed",
          error: "slug-exists",
        });

        return {
          success: false,
          msg: "This slug already exists.",
        };
      }

      await ctx.db.organization.update({
        where: {
          id: ctx.organization.id,
        },
        data: {
          slug: normalizedNewSlug,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "organization",
        action: "updated",
        status: "success",
        metadata: `slug-updated:${normalizedNewSlug}`,
      });

      return {
        success: true,
        data: {
          organization: {
            slug: normalizedNewSlug,
          },
        },
      };
    }),
  updateOrganizationDescription: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization.update({
        where: {
          id: ctx.organization.id,
        },
        data: {
          description: input.description,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "organization",
        action: "updated",
        status: "success",
        metadata: `description-updated`,
      });

      return {
        success: true,
        data: {
          organization: {
            description: input.description,
          },
        },
      };
    }),
  updateOrganizationLogo: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        url: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization.update({
        where: {
          id: ctx.organization.id,
        },
        data: {
          image: input.url === "" ? null : input.url,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "organization",
        action: "updated",
        status: "success",
        metadata: `logo-updated:${input.url}`,
      });

      return {
        success: true,
        data: {
          organization: {
            logo: input.url,
          },
        },
      };
    }),
  updateNotificationPreferences: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        organizationUpdated: z.boolean().optional(),
        memberJoined: z.boolean().optional(),
        memberLeft: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationNotificationConfig.update({
        where: {
          organizationId: ctx.organization.id,
        },
        data: {
          organizationUpdated: input.organizationUpdated ?? true,
          memberJoined: input.memberJoined ?? true,
          memberLeft: input.memberLeft ?? true,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "notification",
        action: "updated",
        status: "success",
        metadata: `notification-preferences-updated`,
      });

      return {
        success: true,
      };
    }),
  leaveOrganization: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
            },
          },
        },
      });
      if (!organization) {
        return {
          success: false,
          msg: "No organization!",
        };
      }

      const member = organization.members.find(
        (member) => member.userId === ctx.session.user.id,
      );

      if (!member) {
        return {
          success: false,
          msg: "You are not a member of this organization!",
        };
      }
      if (member.role === "owner") {
        if (organization.members.length === 1) {
          return {
            success: false,
            msg: "The owner cannot leave the organization if they are the only member. The organization needs to be deleted.",
          };
        }
        return {
          success: false,
          msg: "The owner cannot leave the organization. Please transfer ownership to another member before leaving.",
        };
      }

      await ctx.db.organizationMember.delete({
        where: {
          id: member.id,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "organization",
        type: "member",
        action: "left",
        status: "success",
      });

      return {
        success: true,
      };
    }),
  deleteOrganization: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx }) => {
      await ctx.db.organization.delete({
        where: {
          id: ctx.organization.id,
        },
      });

      return { success: true };
    }),
  inviteUser: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          invites: {
            select: {
              id: true,
              status: true,
              email: true,
            },
          },
        },
      });
      if (!organization) {
        return {
          success: false,
          msg: "No organization!",
        };
      }

      const member = organization.members.find(
        (member) => member.user.email == input.email,
      );

      if (member) {
        return {
          success: false,
          msg: "There is already a member using this email.",
        };
      }

      const invite = organization.invites.find(
        (invite) => invite.email === input.email && invite.status === "waiting",
      );
      if (invite) {
        return {
          success: false,
          msg: "There is an active invite for this email.",
        };
      }

      const organizationInvite = await ctx.db.organizationInvite.create({
        data: {
          organizationId: organization.id,
          userId: userId,
          status: "waiting",
          email: input.email,
          expiresAt: moment(new Date()).add(7, "days").toDate(),
        },
      });

      const appConfig = await getAppConfig();
      if (appConfig.isEmailEnabled) {
        // await caller.authMail.sendInvite({
        //   to: input.email,
        //   inviterTeamToken: organizationInvite.id,
        //   inviterFirstName: ctx.session.user.firstName ?? "User",
        //   inviterEmail: ctx.session.user.email ?? "email",
        //   inviterTeamName: organization.name,
        // });
      }

      await createOrganizationEvent({
        organizationId: organization.id,
        memberId: ctx.organizationMember.id,
        category: "organization",
        type: "invite",
        action: "created",
        status: "success",
        metadata: `email:${input.email}`,
      });

      return {
        success: true,
      };
    }),
  deleteInvitation: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        inviteId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          invites: {
            select: {
              id: true,
              status: true,
              email: true,
            },
          },
        },
      });
      if (!organization) {
        return { success: false, msg: "No organization!" };
      }

      const invite = organization.invites.find(
        (invite) => invite.id === input.inviteId,
      );

      if (!invite) {
        return {
          success: false,
          msg: "No invite",
        };
      }

      if (invite.status === "accepted") {
        return {
          success: false,
          msg: "An accepted invitation cannot be revoked.",
        };
      }

      await ctx.db.organizationInvite.delete({
        where: {
          id: invite.id,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "organization",
        type: "invite",
        action: "deleted",
        status: "success",
        metadata: `invite:${invite.email}`,
      });

      return { success: true };
    }),
  deleteOrganizationMember: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              user: true,
            },
          },
        },
      });

      if (!organization) {
        return {
          success: false,
          msg: "No organization!",
        };
      }

      const removeMember = organization.members.find(
        (member) => member.id === input.memberId,
      );

      if (!removeMember) {
        return {
          success: false,
          msg: "No member!",
        };
      }

      if (removeMember.role === "owner") {
        return {
          success: false,
          msg: "The owner cannot be removed",
        };
      }

      await ctx.db.organizationMember.delete({
        where: {
          id: removeMember.id,
        },
      });

      await createOrganizationEvent({
        organizationId: organization.id,
        memberId: ctx.organizationMember.id,
        category: "organization",
        type: "member",
        action: "kicked",
        status: "success",
        metadata: `member:${removeMember.user.email}`,
      });

      return {
        success: true,
      };
    }),
  getOrganizationMemberModules: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        memberId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const modules = await ctx.db.organizationMemberModule.findMany({
        where: {
          memberId: input.memberId,
        },
        select: {
          name: true,
        },
      });

      return modules.map((m) => m.name);
    }),
  updateOrganizationMemberModules: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        memberId: z.string(),
        modules: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationMember.findFirst({
        where: {
          id: input.memberId,
        },
        select: {
          id: true,
        },
      });

      if (!member) {
        return {
          success: false,
          msg: "No member!",
        };
      }

      await ctx.db.organizationMemberModule.deleteMany({
        where: {
          memberId: input.memberId,
        },
      });

      for (const memberModule of input.modules) {
        await ctx.db.organizationMemberModule.create({
          data: {
            memberId: member.id,
            name: memberModule,
          },
        });
      }

      return {
        success: true,
      };
    }),
  getOrganizationSupportTickets: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      const tickets = await ctx.db.organizationSupportTicket.findMany({
        where: {
          organizationId: ctx.organization.id,
        },
        select: {
          id: true,
          subject: true,
          message: true,
          status: true,
          createdAt: true,
          answeredAt: true,
          member: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tickets;
    }),
  getMemberSupportTickets: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      const isMember = ctx.organizationMember.role === "member";

      const tickets = await ctx.db.organizationMemberSupportTicket.findMany({
        where: {
          organizationId: ctx.organization.id,
          ...(isMember && {
            memberId: ctx.organizationMember.id,
          }),
        },
        select: {
          id: true,
          subject: true,
          message: true,
          status: true,
          createdAt: true,
          answeredAt: true,
          member: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
            },
          },
          answeredOwner: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tickets;
    }),
  createSupportTicket: protectedOrganizationProcedure
    .input(
      z.object({
        slug: z.string(),
        subject: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationMemberSupportTicket.create({
        data: {
          organizationId: ctx.organization.id,
          memberId: ctx.organizationMember.id,
          subject: input.subject,
          message: input.message,
        },
      });

      const member = await ctx.db.organizationMember.findFirst({
        where: {
          id: ctx.organizationMember.id,
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!member) {
        return {
          success: false,
          msg: "No member!",
        };
      }

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "support-ticket",
        action: "created",
        status: "success",
        metadata: `member:${member.user.email}`,
      });

      return {
        success: true,
      };
    }),
  updateSupportTicket: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        ticketId: z.string(),
        status: z.enum(["opened", "in_progress", "resolved"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.organizationMember.id;

      const updateData =
        input.status === "opened"
          ? {
              status: input.status,
              answeredOwnerId: null,
              answeredAt: null,
            }
          : {
              status: input.status,
              answeredOwnerId: ownerId,
              answeredAt: new Date(),
            };

      await ctx.db.organizationMemberSupportTicket.update({
        where: {
          id: input.ticketId,
        },
        data: updateData,
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "support-ticket",
        action: "updated",
        status: "success",
        metadata: `ticket:${input.ticketId}:${input.status}`,
      });

      return {
        success: true,
      };
    }),
  deleteSupportTicket: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
        ticketId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationMemberSupportTicket.delete({
        where: {
          id: input.ticketId,
        },
      });

      await createOrganizationEvent({
        organizationId: ctx.organization.id,
        memberId: ctx.organizationMember.id,
        category: "modal",
        type: "support-ticket",
        action: "deleted",
        status: "success",
        metadata: `ticket:${input.ticketId}`,
      });

      return {
        success: true,
      };
    }),
  getSlackChannels: protectedOrganizationOwnerProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      const channels = await ctx.db.organizationSlackChannel.findMany({
        where: {
          organizationId: ctx.organization.id,
        },
        select: {
          id: true,
          channelName: true,
          teamName: true,
          createdAt: true,
        },
      });

      return channels;
    }),
  //   connectSlackBot: protectedOrganizationOwnerProcedure
  //     .input(
  //       z.object({
  //         slug: z.string(),
  //         code: z.string(),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const result = await caller.authSlack.connectBot({
  //         slug: input.slug,
  //         code: input.code,
  //       });

  //       if (!result.success) {
  //         return {
  //           success: false,
  //           msg: `${result.msg}`,
  //         };
  //       }

  //       if (!result.data) {
  //         return {
  //           success: false,
  //           msg: "No data",
  //         };
  //       }

  //       const channel = await ctx.db.organizationSlackChannel.findFirst({
  //         where: {
  //           organizationId: ctx.organization.id,
  //           channelId: result.data.incoming_webhook.channel_id,
  //         },
  //       });

  //       if (channel) {
  //         await caller.authSlack.sendMessageToChannel({
  //           webhookUrl: result.data.incoming_webhook.url,
  //           message: `This channel is already connected to this organization.`,
  //         });
  //         return {
  //           success: false,
  //           msg: "This channel is already connected to this organization.",
  //         };
  //       }

  //       const encryptedToken = encrypt(result.data.access_token);
  //       await ctx.db.organizationSlackChannel.create({
  //         data: {
  //           memberId: ctx.organizationMember.id,
  //           organizationId: ctx.organization.id,
  //           botUserId: result.data.bot_user_id,
  //           channelId: result.data.incoming_webhook.channel_id,
  //           channelName: result.data.incoming_webhook.channel,
  //           accessToken: encryptedToken,
  //           teamId: result.data.team.id,
  //           teamName: result.data.team.name,
  //           incomingWebhookUrl: result.data.incoming_webhook.url,
  //         },
  //       });

  //       await createOrganizationEvent({
  //         organizationId: ctx.organization.id,
  //         memberId: ctx.organizationMember.id,
  //         category: "organization",
  //         type: "integration",
  //         action: "created",
  //         status: "success",
  //         metadata: `slack`,
  //       });

  //       await caller.authSlack.sendMessageToChannel({
  //         webhookUrl: result.data.incoming_webhook.url,
  //         message: `Hi! I'll be sending you notifications about the <${env.AUTH_URL}/dashboard/${input.slug}|${ctx.organization.name}> organization on ${BRAND_TITLE} through this channel.`,
  //       });

  //       return {
  //         success: true,
  //         data: result.data,
  //       };
  //     }),
  //   disconnectSlackChannel: protectedOrganizationOwnerProcedure
  //     .input(
  //       z.object({
  //         slug: z.string(),
  //         channelId: z.string(),
  //       }),
  //     )
  //     .mutation(async ({ ctx, input }) => {
  //       const channel = await ctx.db.organizationSlackChannel.findFirst({
  //         where: {
  //           id: input.channelId,
  //           organizationId: ctx.organization.id,
  //         },
  //       });

  //       if (!channel) {
  //         return {
  //           success: false,
  //           msg: "No channel found!",
  //         };
  //       }

  //       //TODO handle result
  //       await caller.authSlack.sendMessageToChannel({
  //         webhookUrl: channel.incomingWebhookUrl,
  //         message: `${BRAND_TITLE} has been removed from this conversation. If you need assistance, please reinstall the bot or contact support.`,
  //       });
  //       const decryptedToken = decrypt(channel.accessToken);

  //       //TODO handle result
  //       await caller.authSlack.removeBotFromChannel({
  //         botUserId: channel.botUserId,
  //         accessToken: decryptedToken,
  //         channelId: channel.channelId,
  //       });

  //       await ctx.db.organizationSlackChannel.delete({
  //         where: {
  //           id: input.channelId,
  //         },
  //       });

  //       await createOrganizationEvent({
  //         organizationId: ctx.organization.id,
  //         memberId: ctx.organizationMember.id,
  //         category: "organization",
  //         type: "integration",
  //         action: "deleted",
  //         status: "success",
  //         metadata: `slack:${channel.channelName}`,
  //       });

  //       return {
  //         success: true,
  //       };
  //     }),
  //   disconnetAllSlackChannels: protectedOrganizationOwnerProcedure
  //     .input(
  //       z.object({
  //         slug: z.string(),
  //       }),
  //     )
  //     .mutation(async ({ ctx }) => {
  //       const channels = await ctx.db.organizationSlackChannel.findMany({
  //         where: {
  //           organizationId: ctx.organization.id,
  //         },
  //         select: {
  //           id: true,
  //           botUserId: true,
  //           accessToken: true,
  //           channelId: true,
  //           incomingWebhookUrl: true,
  //         },
  //       });

  //       if (channels.length === 0) {
  //         return {
  //           success: false,
  //           msg: "No channels found!",
  //         };
  //       }

  //       for (const channel of channels) {
  //         //TODO handle result
  //         await caller.authSlack.sendMessageToChannel({
  //           webhookUrl: channel.incomingWebhookUrl,
  //           message: `${BRAND_TITLE} has been removed from this conversation. If you need assistance, please reinstall the bot or contact support.`,
  //         });

  //         const decryptedToken = decrypt(channel.accessToken);
  //         //TODO handle result
  //         await caller.authSlack.removeBotFromChannel({
  //           botUserId: channel.botUserId,
  //           accessToken: decryptedToken,
  //           channelId: channel.channelId,
  //         });

  //         await createOrganizationEvent({
  //           organizationId: ctx.organization.id,
  //           memberId: ctx.organizationMember.id,
  //           category: "organization",
  //           type: "integration",
  //           action: "deleted",
  //           status: "success",
  //           metadata: `slack:${channel.channelId}`,
  //         });
  //       }

  //       await ctx.db.organizationSlackChannel.deleteMany({
  //         where: {
  //           organizationId: ctx.organization.id,
  //         },
  //       });

  //       return {
  //         success: true,
  //       };
  //     }),
  //   getSlackRedirectUrl: protectedOrganizationOwnerProcedure
  //     .input(
  //       z.object({
  //         slug: z.string(),
  //       }),
  //     )
  //     .mutation(({ input }) => {
  //       return `https://slack.com/oauth/v2/authorize?client_id=${env.AUTH_SLACK_CLIENT_ID}&scope=incoming-webhook,channels:read,chat:write&redirect_uri=${env.NEXT_PUBLIC_APP_URL}/dashboard/${input.slug}/settings/integrations`;
  //     }),
};
