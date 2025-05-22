/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  UserData,
  UserServerToClientEventKey,
} from "@fulltemplate/socket";

import { SOCKET_USER_MAP } from "~/lib/socket";

export const emitToUserByUserId = (
  userId: string,
  event: UserServerToClientEventKey,
  payload?: unknown,
): boolean => {
  return emitToUserByUserIds([userId], event, payload);
};

export const emitToUserByUserIds = (
  userIds: string[],
  event: UserServerToClientEventKey,
  payload?: unknown,
): boolean => {
  for (const [, value] of SOCKET_USER_MAP.entries()) {
    if (userIds.includes(value.user.id)) {
      // @ts-ignore
      value.socket.emit(event, payload);
    }
  }
  return true;
};

export const emitToUserByConnectionId = (
  connectionId: string,
  event: UserServerToClientEventKey,
  payload?: unknown,
): boolean => {
  const value = SOCKET_USER_MAP.get(connectionId);
  if (value) {
    // @ts-ignore
    value.socket.emit(event, payload);
    return true;
  }
  return false;
};

export const getUserDataByUserId = (userId: string): UserData[] => {
  const userData = [];
  for (const [, value] of SOCKET_USER_MAP.entries()) {
    if (userId === value.user.id) {
      userData.push(value);
    }
  }
  return userData;
};
