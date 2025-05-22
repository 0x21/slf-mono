import type {
  AdminData,
  AdminServerToClientEventKey,
  AdminServerToClientEvents,
  OnlineUser,
} from "@fulltemplate/socket";

import {
  SOCKET_ADMIN_MAP,
  SOCKET_CONNECTION_MAP,
  SOCKET_USER_MAP,
} from "~/lib/socket";

export const emitToAdminByUserId = <T extends AdminServerToClientEventKey>(
  userId: string,
  event: T,
  payload: Parameters<AdminServerToClientEvents[T]>[0],
): boolean => {
  return emitToAdminByUserIds([userId], event, payload);
};

export const emitToAdminByUserIds = <T extends AdminServerToClientEventKey>(
  userIds: string[],
  event: T,
  payload: Parameters<AdminServerToClientEvents[T]>[0],
): boolean => {
  for (const [_, value] of SOCKET_ADMIN_MAP.entries()) {
    if (userIds.includes(value.user.id)) {
      // @ts-ignore
      value.socket.emit(event, ...payload);
    }
  }
  return true;
};

export const emitToAdmins = <T extends AdminServerToClientEventKey>(
  event: T,
  payload: Parameters<AdminServerToClientEvents[T]>[0],
): boolean => {
  for (const [_, value] of SOCKET_ADMIN_MAP.entries()) {
    // @ts-ignore
    value.socket.emit(event, payload);
  }
  return true;
};

export const emitToAdminByConnectionId = <
  T extends AdminServerToClientEventKey,
>(
  connectionId: string,
  event: T,
  payload: Parameters<AdminServerToClientEvents[T]>,
): boolean => {
  const value = SOCKET_ADMIN_MAP.get(connectionId);
  if (value) {
    value.socket.emit(event, ...payload);
    return true;
  }
  return false;
};

// export const emitWithAckToAdminByUserIds = async <
//   T extends AdminServerToClientEventKeyWithAck,
// >(
//   userIds: string[],
//   event: T,
//   payload: Parameters<AdminServerToClientEventsWithAck[T]>[0],
//   timeout = 5000,
// ): Promise<void> => {
//   for (const [_, value] of SOCKET_ADMIN_MAP.entries()) {
//     if (userIds.includes(value.user.id)) {
//       try {
//         const result = await value.socket
//           .timeout(timeout)
//           // @ts-ignore
//           .emitWithAck(event, ...payload);

//         if (result.success) {
//           callback({
//             success: true,
//             data: result,
//           });
//         } else {
//           callback({
//             success: false,
//             error: JSON.stringify(result.error),
//           });
//         }
//       } catch (error) {
//         const callback = payload[1];
//         callback({
//           success: false,
//           error: JSON.stringify(error),
//         });
//       }
//     }
//   }
// };

export const getAdminDataByUserId = (userId: string): AdminData[] => {
  const adminData = [];
  for (const [, value] of SOCKET_ADMIN_MAP.entries()) {
    if (userId === value.user.id) {
      adminData.push(value);
    }
  }
  return adminData;
};

export const getOnlineUsersData = (): OnlineUser[] => {
  const users = [];
  for (const entry of SOCKET_CONNECTION_MAP.entries()) {
    // const socketId = entry[0];
    const connection = entry[1];
    const userData = SOCKET_USER_MAP.get(connection.connectionId);
    if (!userData) {
      continue;
    }
    users.push({
      connectionId: userData.connectionId,
      user: userData
        ? {
            sessionId: userData.sessionId,
            userId: userData.user.id,
            email: userData.user.email,
            role: userData.user.role,
          }
        : undefined,
      pathname: connection.pathname,
      focus: connection.focus,
    });
  }
  return users;
};
