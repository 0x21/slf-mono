/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Socket } from "socket.io";
import { z } from "zod";

import type { Result } from "@fulltemplate/common";

import type { OnlineUser } from "./types.user";

export interface AdminData {
  connectionId: string;
  sessionId: string;
  user: {
    id: string;
  };
  socket: Socket<AdminClientToServerEvents, AdminServerToClientEvents>;
}
export interface AdminServerToClientEvents {
  navigate: (
    data: {
      connectionId: string | undefined;
      url: string;
      openNewTab: boolean;
    },
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  reloadTab: (
    data: {
      adminUserId: string | undefined;
    },
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  closeTab: (
    data: {
      adminUserId: string | undefined;
    },
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  sessionUpdated: (data: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    username: string | null;
    image: string | null;
    role: string;
  }) => void;
  onlineUsersData: (data: { users: OnlineUser[] }) => void;
}

export type AdminServerToClientEventKey = keyof AdminServerToClientEvents;

export interface AdminClientToServerEvents {
  onlineUsers: (data: unknown, callback?: (payload?: any) => void) => void;
  adminNavigateTab: (
    data: unknown,
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  adminReloadTab: (
    data: unknown,
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  adminCloseTab: (
    data: unknown,
    callback: (
      payload: Result<
        | {
            success: true;
          }
        | {
            success: false;
            error: string;
          },
        string
      >,
    ) => void,
  ) => void;
  userUpdated: (data: unknown, callback?: (payload?: any) => void) => void;
}

export const adminClientToServerSchemas = {
  onlineUsers: z.object({}),
  adminNavigateTab: z.object({
    connectionId: z.string(),
    url: z.string(),
    openNewTab: z.boolean(),
  }),
  adminReloadTab: z.object({
    connectionId: z.string(),
  }),
  adminCloseTab: z.object({
    connectionId: z.string(),
  }),
  userUpdated: z.object({
    userId: z.string(),
  }),
} as const;

export type AdminClientToServerEventKey = keyof AdminClientToServerEvents;
