/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Socket } from "socket.io";

import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export interface UserData {
  connectionId: string;
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  sessionId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    username: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface OnlineUser {
  connectionId: string;
  user?: {
    userId: string;
    sessionId: string;
    email: string | null;
    role: string;
  };
  pathname: string | undefined;
  focus: boolean | undefined;
}

export interface UserServerToClientEvents {
  // connected: (data: { id: string }) => void;
}

export type UserServerToClientEventKey = keyof UserServerToClientEvents;

export interface UserClientToServerEvents {
  // authenticate: (
  //   data: unknown,
  //   callback: (payload: Result<boolean>) => void,
  // ) => void;
}

export type UserClientToServerEventKey = keyof UserClientToServerEvents;

export const userSchemas = {
  // authenticate: z.object({
  //   id: z.string().uuid(),
  //   sessionId: z.string().uuid(),
  //   pathname: z.string(),
  //   focus: z.boolean(),
  // }),
} as const;
