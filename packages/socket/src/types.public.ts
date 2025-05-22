/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Socket } from "socket.io";
import { z } from "zod";

import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export interface ConnectionData {
  connectionId: string;
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  pathname?: string;
  focus?: boolean;
  reqDetails?: {
    continent?: string | null;
    country?: string | null;
    city?: string | null;
    region?: string | null;
    regionCode?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    postalCode?: string | null;
    ip?: string | null;
    timezone?: string | null;
    userAgent?: any | null;
    environment?: string;
  };
  connectedAt: Date;
}

export interface PublicServerToClientEvents {
  // connected: (data: { id: string }) => void;
}

export type PublicServerToClientEventKey = keyof PublicServerToClientEvents;

export interface PublicClientToServerEvents {
  pathname: (data: unknown, callback?: (payload?: any) => void) => void;
  focus: (data: unknown, callback?: (payload?: any) => void) => void;
}

export type PublicClientToServerEventKey = keyof PublicClientToServerEvents;

export const publicSchemas = {
  pathname: z.object({
    pathname: z.string(),
  }),
  focus: z.object({
    focus: z.boolean(),
  }),
} as const;
