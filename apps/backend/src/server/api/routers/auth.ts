/* eslint-disable @typescript-eslint/ban-ts-comment */
import { z } from "zod";

import { SOCKET_USER_MAP } from "~/lib/socket";
import { createTRPCRouter, protectedApiProcedure } from "~/server/api/trpc";

/* eslint-disable @typescript-eslint/no-unsafe-argument */
export const authRouter = createTRPCRouter({
  // registerSocket: protectedApiProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       country: z.string().nullable().optional(),
  //       city: z.string().nullable().optional(),
  //       region: z.string().nullable().optional(),
  //     }),
  //   )
  //   .mutation(({ input }) => {
  //     for (const [connectionId, value] of SOCKET_USER_MAP) {
  //       if (connectionId === input.id) {
  //         SOCKET_USER_MAP.set(connectionId, {
  //           ...value,
  //           country: input.country ?? undefined,
  //           city: input.city ?? undefined,
  //           region: input.region ?? undefined,
  //         });
  //         const onlineUsers = getOnlineUsersData();
  //         emitToAdmins("onlineUsersData", {
  //           users: onlineUsers,
  //         });
  //         break;
  //       }
  //     }
  //     return { success: true };
  //   }),
  navigateSocket: protectedApiProcedure
    .input(
      z.object({
        userId: z.string(),
        url: z.string(),
      }),
    )
    .mutation(({ input }) => {
      for (const [, value] of SOCKET_USER_MAP) {
        // @ts-ignore
        value.socket.emit("navigate", {
          url: input.url,
        });
      }
      return { success: true };
    }),
  notifySocketClient: protectedApiProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        event: z.string(),
        data: z.any(),
      }),
    )
    .mutation(({ input }) => {
      let notified = 0;
      for (const [, value] of SOCKET_USER_MAP) {
        if (input.userIds.includes(value.user.id)) {
          // @ts-ignore
          value.socket.emit(input.event, input.data);
          notified += 1;
        }
      }
      return { success: true, notified: notified };
    }),
});
