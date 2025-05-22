import type {
  AdminClientToServerEvents,
  AdminServerToClientEvents,
} from "./types.admin";
import type {
  UserClientToServerEvents,
  UserServerToClientEvents,
} from "./types.user";
import { adminClientToServerSchemas } from "./types.admin";
import {
  PublicClientToServerEvents,
  publicSchemas,
  PublicServerToClientEvents,
} from "./types.public";
import { userSchemas } from "./types.user";

export interface ServerToClientEvents
  extends PublicServerToClientEvents,
    UserServerToClientEvents,
    AdminServerToClientEvents {}

export type ServerToClientEventKey = keyof ServerToClientEvents;

export interface ClientToServerEvents
  extends PublicClientToServerEvents,
    UserClientToServerEvents,
    AdminClientToServerEvents {}

export type ClientToServerEventKey = keyof ClientToServerEvents;

export const clientToServerSchemas = {
  ...publicSchemas,
  ...userSchemas,
  ...adminClientToServerSchemas,
} as const;
