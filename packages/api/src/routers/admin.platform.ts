import { v4 } from "uuid";
import { z } from "zod";

import { createOrganizationEvent, getAppConfig } from "@fulltemplate/helpers";

import { protectedAdminProcedure } from "../trpc";

export const adminPlatformRouter = {
  getUserOrganizations: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organizations = await ctx.db.organization.findMany({
        where: {
          members: {
            some: {
              userId: input.userId,
            },
          },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          members: {
            where: {
              userId: input.userId,
            },
            select: {
              id: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 500,
      });
      return organizations;
    }),
  getContacts: protectedAdminProcedure.query(async ({ ctx }) => {
    const contacts = await ctx.db.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        message: true,
        phone: true,
        status: true,
        answeredAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return contacts;
  }),
  getOrganizations: protectedAdminProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;

    const appConfig = await getAppConfig();
    const organizations = await ctx.db.organization.findMany({
      where: {
        NOT:
          appConfig.isSuperadminHidden && userRole === "admin"
            ? {
                members: {
                  some: {
                    role: "owner",
                    user: {
                      role: "superadmin",
                    },
                  },
                },
              }
            : undefined,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            role: "owner",
          },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        supportTickets: {
          where: {
            status: "pending",
          },
        },
        _count: {
          select: {
            members: {
              where: {
                user: {
                  role: {
                    not:
                      appConfig.isSuperadminHidden && userRole === "admin"
                        ? "superadmin"
                        : undefined,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });
    return organizations;
  }),
  getOrganizationMembers: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role;

      const appConfig = await getAppConfig();
      const members = await ctx.db.organizationMember.findMany({
        where: {
          user: {
            role: {
              not:
                appConfig.isSuperadminHidden && userRole === "admin"
                  ? "superadmin"
                  : undefined,
            },
          },
          organization: {
            slug: input.slug,
          },
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
          createdAt: true,
          role: true,
        },
      });
      return members;
    }),
  kickOrganizationMember: protectedAdminProcedure
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
              user: {
                select: {
                  email: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          invites: {
            select: {
              id: true,
              userId: true,
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

      const removeMember = organization.members.find(
        (member) => member.id === input.memberId,
      );

      if (!removeMember) {
        await createOrganizationEvent({
          organizationId: organization.id,
          category: "organization",
          type: "member",
          action: "kicked",
          status: "failed",
          error: "no-member",
        });

        return {
          success: false,
          msg: "No member!",
        };
      }

      if (removeMember.role === "owner") {
        const newOwner = organization.members.find(
          (member) => member.id !== removeMember.id,
        );

        if (newOwner) {
          await ctx.db.organizationMember.update({
            where: {
              id: newOwner.id,
            },
            data: {
              role: "owner",
            },
          });
        }
      }

      await ctx.db.organizationMember.delete({
        where: {
          id: removeMember.id,
        },
      });

      const invite = organization.invites.find(
        (invite) => invite.email === removeMember.user.email,
      );

      if (invite) {
        await ctx.db.organizationInvite.delete({
          where: {
            id: invite.id,
          },
        });
      }

      const remainingMembers = await ctx.db.organizationMember.count({
        where: {
          organizationId: organization.id,
        },
      });

      if (remainingMembers === 0) {
        await ctx.db.organization.delete({
          where: {
            id: organization.id,
          },
        });

        return {
          success: true,
          organizationDeleted: true,
        };
      }

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "organization",
        type: "member",
        action: "kicked",
        status: "success",
        metadata: `admin:member-kicked:${removeMember.user.email}`,
      });

      return {
        success: true,
      };
    }),
  kickOrganizationMembers: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
        memberIds: z.array(z.string()),
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
              user: {
                select: {
                  email: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          invites: {
            select: {
              id: true,
              userId: true,
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

      const membersToRemove = organization.members.filter((member) =>
        input.memberIds.includes(member.id),
      );

      const ownersToRemove = membersToRemove.filter(
        (member) => member.role === "owner",
      );

      for (const removeMember of membersToRemove) {
        await ctx.db.organizationMember.delete({
          where: {
            id: removeMember.id,
          },
        });

        const invite = organization.invites.find(
          (invite) => invite.email === removeMember.user.email,
        );
        if (invite) {
          await ctx.db.organizationInvite.delete({
            where: {
              id: invite.id,
            },
          });
        }
      }

      if (ownersToRemove.length > 0) {
        const updatedOrganization = await ctx.db.organization.findFirst({
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
                user: true,
              },
            },
          },
        });

        if (!updatedOrganization) {
          return {
            success: false,
            msg: "No organization!",
          };
        }

        const remainingMembers = updatedOrganization.members.filter(
          (member) => member.role !== "owner",
        );

        if (remainingMembers.length > 0) {
          const newOwner = remainingMembers[0];

          if (newOwner) {
            await ctx.db.organizationMember.update({
              where: {
                id: newOwner.id,
              },
              data: {
                role: "owner",
              },
            });
          }
        }
      }

      const remainingMembersCount = await ctx.db.organizationMember.count({
        where: {
          organizationId: organization.id,
        },
      });

      if (remainingMembersCount === 0) {
        await ctx.db.organization.delete({
          where: {
            id: organization.id,
          },
        });

        return {
          success: true,
          organizationDeleted: true,
        };
      }

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "organization",
        type: "member",
        action: "kicked",
        status: "success",
        metadata: `admin:${membersToRemove.length}-members-kicked`,
      });

      return {
        success: true,
      };
    }),
  updateContactStatus: protectedAdminProcedure
    .input(
      z.object({
        contactId: z.string(),
        status: z.enum(["opened", "in_progress", "resolved"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updateData =
        input.status === "opened"
          ? {
              status: input.status,
              userId: null,
              answeredAt: null,
            }
          : {
              status: input.status,
              userId: userId,
              answeredAt: new Date(),
            };

      await ctx.db.contact.update({
        where: {
          id: input.contactId,
        },
        data: updateData,
      });

      return {
        success: true,
      };
    }),
  deleteOrganization: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization.delete({
        where: {
          slug: input.slug,
        },
      });
      return {
        success: true,
      };
    }),
  deleteOrganizations: protectedAdminProcedure
    .input(
      z.object({
        slugs: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization.deleteMany({
        where: {
          slug: {
            in: input.slugs,
          },
        },
      });
      return {
        success: true,
      };
    }),
  createOrganization: protectedAdminProcedure
    .input(
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        description: z
          .string()
          .max(200, "Description must be less than 100 characters"),
        ownerUserId: z.string(),
        memberUserIds: z.array(z.string()).optional(),
        image: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUser = await ctx.db.user.findUnique({
        where: {
          id: input.ownerUserId,
        },
      });

      if (!ownerUser) {
        return {
          success: false,
          msg: "No user!",
        };
      }

      let slug = input.name.toLowerCase().replace(/\s/g, "-");

      const existingOrganization = await ctx.db.organization.findFirst({
        where: {
          slug: slug,
        },
      });

      if (existingOrganization) {
        slug = `${slug}-${v4().substring(0, 8)}`;
      }

      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug: slug,
          image: input.image === "" ? null : input.image,
          members: {
            create: [
              {
                userId: input.ownerUserId,
                role: "owner",
              },
              ...(input.memberUserIds
                ? input.memberUserIds.map((memberId) => ({
                    userId: memberId,
                    role: "member",
                  }))
                : []),
            ],
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

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "modal",
        type: "organization",
        action: "created",
        status: "success",
        metadata: "admin:organization-created",
      });

      return {
        success: true,
      };
    }),
  addNewMemberToOrganization: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
        userId: z.string(),
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
              userId: true,
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

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
      });

      if (!user) {
        await createOrganizationEvent({
          organizationId: organization.id,
          category: "organization",
          type: "member",
          action: "added",
          status: "failed",
          metadata: `admin:member-added`,
          error: "no-user",
        });

        return {
          success: false,
          msg: "No user!",
        };
      }

      const existingMembersUserIds = organization.members.map((m) => m.userId);

      if (existingMembersUserIds.includes(input.userId)) {
        await createOrganizationEvent({
          organizationId: organization.id,
          category: "organization",
          type: "member",
          action: "added",
          status: "failed",
          metadata: `admin:member-added:${user.email}`,
          error: "user-already-member-of-organization",
        });

        return {
          success: false,
          msg: "This user is already a member of this organization!",
        };
      }

      await ctx.db.organizationMember.create({
        data: {
          organizationId: organization.id,
          role: "member",
          userId: input.userId,
        },
      });

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "organization",
        type: "member",
        action: "added",
        status: "success",
        metadata: `admin:member-added:${user.email}`,
      });

      return {
        success: true,
      };
    }),
  getOrganizationModules: protectedAdminProcedure
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
  updateOrganizationModules: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
        modules: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
        },
      });

      if (!organization) {
        return {
          success: false,
          msg: "No organization!",
        };
      }

      await ctx.db.organizationModule.deleteMany({
        where: {
          organizationId: organization.id,
        },
      });

      for (const organizationModule of input.modules) {
        await ctx.db.organizationModule.create({
          data: {
            organizationId: organization.id,
            name: organizationModule,
          },
        });
      }

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "modal",
        type: "module",
        action: "updated",
        status: "success",
        metadata: "admin:modules-updated",
      });

      return {
        success: true,
      };
    }),
  updateOrganization: protectedAdminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z
          .string()
          .min(1, { message: "Slug must contain at least 1 character" })
          .max(16, { message: "Slug must not exceed 16 characters" })
          .regex(/^[a-z0-9-]+$/, {
            message:
              "Only lowercase alphanumeric characters and hyphens are allowed",
          }),
        description: z.string().nullable(),
        image: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.findFirst({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!organization) {
        return {
          success: false,
          msg: "No organization!",
        };
      }

      const normalizedNewSlug = input.slug.toLowerCase();

      if (organization.slug !== normalizedNewSlug) {
        const slugExists = await ctx.db.organization.findFirst({
          where: {
            slug: normalizedNewSlug,
          },
        });

        if (slugExists) {
          return {
            success: false,
            msg: "This slug already exists.",
          };
        }
      }

      await ctx.db.organization.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          slug: normalizedNewSlug,
          description: input.description === "" ? null : input.description,
          image: input.image === "" ? null : input.image,
        },
      });

      await createOrganizationEvent({
        organizationId: organization.id,
        category: "modal",
        type: "organization",
        action: "updated",
        status: "success",
        metadata: "admin:organization-updated",
      });

      return {
        success: true,
      };
    }),
  getOrganizationSupportTickets: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.db.organizationSupportTicket.findMany({
        where: {
          organization: {
            slug: input.slug,
          },
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
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          answeredAdmin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return tickets;
    }),
  updateSupportTicket: protectedAdminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(["opened", "in_progress", "resolved"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const ticket = await ctx.db.organizationSupportTicket.findFirst({
        where: {
          id: input.ticketId,
        },
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              members: {
                where: {
                  role: "owner",
                },
                select: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        return {
          success: false,
          msg: "No ticket!",
        };
      }

      const updateData =
        input.status === "opened"
          ? {
              status: input.status,
              answeredAdminId: null,
              answeredAt: null,
            }
          : {
              status: input.status,
              answeredAdminId: userId,
              answeredAt: new Date(),
            };

      await ctx.db.organizationSupportTicket.update({
        where: {
          id: input.ticketId,
        },
        data: updateData,
      });

      if (input.status === "resolved") {
        const appConfig = await getAppConfig();
        if (appConfig.isEmailEnabled) {
          for (const member of ticket.organization.members) {
            // await caller.authMail.sendSupportTicketResolved({
            //   to: member.user.email ?? "",
            //   organizationName: ticket.organization.name,
            //   organizationSlug: ticket.organization.slug,
            // });
          }
        }
      }

      return {
        success: true,
      };
    }),
  deleteSupportTicket: protectedAdminProcedure
    .input(
      z.object({
        ticketId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationSupportTicket.delete({
        where: {
          id: input.ticketId,
        },
      });

      return {
        success: true,
      };
    }),
  getFeedbacks: protectedAdminProcedure.query(async ({ ctx }) => {
    const feedbacks = await ctx.db.feedback.findMany({
      select: {
        id: true,
        reason: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return feedbacks;
  }),
  deleteFeedback: protectedAdminProcedure
    .input(
      z.object({
        feedbackId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.feedback.delete({
        where: {
          id: input.feedbackId,
        },
      });

      return {
        success: true,
      };
    }),
  getEvents: protectedAdminProcedure
    .input(
      z.object({
        slug: z.string(),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cursor = input.cursor ?? 0;
      const limit = 500;

      const appConfig = await getAppConfig();
      const events = await ctx.db.organizationEvent.findMany({
        where: {
          organization: {
            slug: input.slug,
          },
          ...(appConfig.isSuperadminHidden && ctx.session.user.role === "admin"
            ? {
                member: {
                  user: {
                    role: {
                      not: "superadmin",
                    },
                  },
                },
              }
            : {}),
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
                  role: true,
                },
              },
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
        take: limit + 1,
        skip: cursor * limit,
      });

      let nextCursor: number | null = null;
      if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem ? cursor + 1 : null;
      }

      const eventCount = await ctx.db.organizationEvent.count({
        where: {
          organization: {
            slug: input.slug,
          },
          ...(appConfig.isSuperadminHidden && ctx.session.user.role === "admin"
            ? {
                member: {
                  user: {
                    role: {
                      not: "superadmin",
                    },
                  },
                },
              }
            : {}),
        },
      });

      return {
        events: events,
        totalCount: eventCount,
        nextCursor: nextCursor,
      };
    }),
  deleteEvent: protectedAdminProcedure
    .input(
      z.object({
        eventId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationEvent.delete({
        where: {
          id: input.eventId,
        },
      });

      return {
        success: true,
      };
    }),
  deleteEvents: protectedAdminProcedure
    .input(
      z.object({
        eventIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organizationEvent.deleteMany({
        where: {
          id: {
            in: input.eventIds,
          },
        },
      });

      return {
        success: true,
      };
    }),
};
