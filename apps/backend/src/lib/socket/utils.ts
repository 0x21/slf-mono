/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { ServerToClientEventKey } from "@fulltemplate/socket";

import { SOCKET_USER_MAP } from "./index";

export const emitToClientByUserId = (
  userId: string,
  event: ServerToClientEventKey,
  payload?: unknown,
): boolean => {
  return emitToClientByUserIds([userId], event, payload);
};

export const emitToClientByUserIds = (
  userIds: string[],
  event: ServerToClientEventKey,
  payload?: unknown,
): boolean => {
  for (const [, value] of SOCKET_USER_MAP.entries()) {
    if (userIds.includes(value.user.id)) {
      //@ts-ignore
      value.socket.emit(event, payload);
    }
  }
  return true;
};
