"use client";

import type { Socket } from "socket.io-client";
import io from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@fulltemplate/socket";

import { env } from "~/env";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.NEXT_PUBLIC_SOCKET_URL,
  {
    withCredentials: true,
  },
);
// export const socket: Socket = io(env.NEXT_PUBLIC_SOCKET_URL);
