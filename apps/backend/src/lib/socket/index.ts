import * as socketio from "socket.io";
import { v4 } from "uuid";

import type {
  AdminData,
  ClientToServerEvents,
  ConnectionData,
  ServerToClientEvents,
  UserData,
} from "@fulltemplate/socket";
import { db } from "@fulltemplate/db";
import { createEvent } from "@fulltemplate/event";
import { getRequestDetailsSync } from "@fulltemplate/helpers/src/request-details";
import logger from "@fulltemplate/logger";
import { clientToServerSchemas } from "@fulltemplate/socket";

import { emitToAdmins, getOnlineUsersData } from "~/lib/socket/utils.admin";
import { getUserSession } from "../auth";

export const io = new socketio.Server<
  ClientToServerEvents,
  ServerToClientEvents
>();

export const SOCKET_CONNECTION_MAP = new Map<string, ConnectionData>([]);
export const SOCKET_USER_MAP = new Map<string, UserData>([]);
export const SOCKET_ADMIN_MAP = new Map<string, AdminData>([]);

export const setupSocketIO = () => {
  logger.info("Socket is running");

  io.on("connection", async (socket) => {
    logger.verbose(`client connected: ${socket.id}`);

    const socketHeaders = new Headers();
    Object.entries(socket.request.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((val) => socketHeaders.append(key, val));
      } else if (value) {
        socketHeaders.append(key, value);
      }
    });

    const reqDetails = getRequestDetailsSync(socketHeaders);

    const connectionId = v4();
    SOCKET_CONNECTION_MAP.set(connectionId, {
      connectionId: connectionId,
      socket: socket,
      reqDetails: reqDetails,
      connectedAt: new Date(),
    });

    socket.on("disconnect", (reason) => {
      logger.verbose(`client disconnected: ${reason}`);

      SOCKET_CONNECTION_MAP.delete(connectionId);
      SOCKET_USER_MAP.delete(connectionId);
      SOCKET_ADMIN_MAP.delete(connectionId);

      const onlineUsers = getOnlineUsersData();
      emitToAdmins("onlineUsersData", {
        users: onlineUsers,
      });
    });

    // public
    socket.on("pathname", async (data: unknown) => {
      const result = await clientToServerSchemas.pathname.safeParseAsync(data);
      if (!result.success) {
        return;
      }
      const connection = SOCKET_CONNECTION_MAP.get(connectionId);
      if (!connection) {
        return;
      }
      SOCKET_CONNECTION_MAP.set(connectionId, {
        ...connection,
        pathname: result.data.pathname,
      });
      const onlineUsers = getOnlineUsersData();
      emitToAdmins("onlineUsersData", {
        users: onlineUsers,
      });
    });
    socket.on("focus", async (data: unknown) => {
      const result = await clientToServerSchemas.focus.safeParseAsync(data);
      if (!result.success) {
        return;
      }
      const connection = SOCKET_CONNECTION_MAP.get(connectionId);
      if (!connection) {
        return;
      }
      SOCKET_CONNECTION_MAP.set(connectionId, {
        ...connection,
        focus: result.data.focus,
      });
      const onlineUsers = getOnlineUsersData();
      emitToAdmins("onlineUsersData", {
        users: onlineUsers,
      });
    });

    // user

    // admin
    socket.on("userUpdated", async (data: unknown) => {
      const adminData = SOCKET_ADMIN_MAP.get(connectionId);
      if (!adminData) {
        // TODO report
        return;
      }

      const result =
        await clientToServerSchemas.userUpdated.safeParseAsync(data);
      if (!result.success) {
        return;
      }

      const userId = result.data.userId;
      // TODO swap with helper
      const userData = [...SOCKET_USER_MAP.values()].find(
        (value) => value.user.id === userId,
      );

      if (!userData) {
        return;
      }

      const user = await db.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return;
      }

      if (user.role === "user") {
        for (const [socketId, _] of SOCKET_ADMIN_MAP.entries()) {
          if (socketId === userData.socket.id) {
            SOCKET_ADMIN_MAP.delete(socketId);
            break;
          }
        }
      }

      const connection = SOCKET_CONNECTION_MAP.get(connectionId);
      if (!connection) {
        return;
      }

      SOCKET_USER_MAP.set(connectionId, {
        ...connection,
        user: user,
        sessionId: userData.sessionId,
      });

      userData.socket.emit("sessionUpdated", {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        username: user.username,
        image: user.image,
        role: user.role,
      });
    });
    socket.on("onlineUsers", () => {
      const adminData = SOCKET_ADMIN_MAP.get(connectionId);
      if (!adminData) {
        // TODO report
        return;
      }

      const onlineUsers = getOnlineUsersData();
      emitToAdmins("onlineUsersData", {
        users: onlineUsers,
      });
    });
    socket.on("adminNavigateTab", async (data, callback) => {
      const adminData = SOCKET_ADMIN_MAP.get(connectionId);
      if (!adminData) {
        // TODO report
        return;
      }

      const result =
        await clientToServerSchemas.adminNavigateTab.safeParseAsync(data);
      if (!result.success) {
        callback({
          success: false,
          error: "Invalid data",
        });
        return;
      }

      const currentUserData = SOCKET_USER_MAP.get(connectionId);
      if (!currentUserData) {
        callback({
          success: false,
          error: "User not found",
        });
        return;
      }

      const userData = SOCKET_USER_MAP.get(result.data.connectionId);

      if (!userData) {
        callback({
          success: false,
          error: "User not found",
        });
        return;
      }

      try {
        const res = await userData.socket.emitWithAck("navigate", {
          connectionId: result.data.connectionId,
          url: result.data.url,
          openNewTab: result.data.openNewTab,
        });
        if (!res.success) {
          await createEvent({
            userId: currentUserData.user.id,
            category: "admin",
            type: "navigate",
            action: "created",
            status: "failed",
            error: res.error,
            metadata: `admin:navigate:${userData.user.email}:url-${result.data.url}:new-tab-${result.data.openNewTab}`,
          });
          callback({ success: false, error: res.error });
          return;
        }

        if (!res.data.success) {
          await createEvent({
            userId: currentUserData.user.id,
            category: "admin",
            type: "navigate",
            action: "created",
            status: "failed",
            error: res.data.error,
            metadata: `admin:navigate:${userData.user.email}:url-${result.data.url}:new-tab-${result.data.openNewTab}`,
          });
          callback({
            success: true,
            data: {
              success: false,
              error: res.data.error,
            },
          });
          return;
        }

        await createEvent({
          userId: currentUserData.user.id,
          category: "admin",
          type: "navigate",
          action: "created",
          status: "success",
          metadata: `admin:navigate:${userData.user.email}:url-${result.data.url}:new-tab-${result.data.openNewTab}`,
        });
        callback({
          success: true,
          data: {
            success: true,
          },
        });
      } catch (error) {
        callback({ success: false, error: JSON.stringify(error) });
        await createEvent({
          userId: currentUserData.user.id,
          category: "admin",
          type: "navigate",
          action: "created",
          status: "failed",
          error: JSON.stringify(error),
          metadata: `admin:navigate:${userData.user.email}:url-${result.data.url}:new-tab-${result.data.openNewTab}`,
        });
      }
    });
    socket.on("adminReloadTab", async (data, callback) => {
      const adminData = SOCKET_ADMIN_MAP.get(connectionId);
      if (!adminData) {
        // TODO report
        return;
      }

      const result =
        await clientToServerSchemas.adminReloadTab.safeParseAsync(data);
      if (!result.success) {
        return;
      }

      const currentUserData = SOCKET_USER_MAP.get(connectionId);
      const userData = SOCKET_USER_MAP.get(result.data.connectionId);

      if (userData) {
        try {
          const res = await userData.socket.emitWithAck("reloadTab", {
            adminUserId: currentUserData?.user.id,
          });

          if (!res.success) {
            await createEvent({
              userId: currentUserData?.user.id,
              category: "admin",
              type: "reloadTab",
              action: "created",
              status: "failed",
              error: res.error,
              metadata: `admin:reload-tab:${userData.user.email}`,
            });
            callback({ success: false, error: res.error });
            return;
          }

          if (!res.data.success) {
            await createEvent({
              userId: currentUserData?.user.id,
              category: "admin",
              type: "reloadTab",
              action: "created",
              status: "failed",
              error: res.data.error,
              metadata: `admin:reload-tab:${userData.user.email}`,
            });
            callback({
              success: true,
              data: {
                success: false,
                error: res.data.error,
              },
            });
            return;
          }

          await createEvent({
            userId: currentUserData?.user.id,
            category: "admin",
            type: "reloadTab",
            action: "created",
            status: "success",
            metadata: `admin:reload-tab:${userData.user.email}`,
          });
          callback({
            success: true,
            data: {
              success: true,
            },
          });
        } catch (error) {
          callback({ success: false, error: JSON.stringify(error) });
          await createEvent({
            userId: currentUserData?.user.id,
            category: "admin",
            type: "reloadTab",
            action: "created",
            status: "failed",
            error: JSON.stringify(error),
            metadata: `admin:reload-tab:${userData.user.email}`,
          });
        }
      }
    });
    socket.on("adminCloseTab", async (data, callback) => {
      const adminData = SOCKET_ADMIN_MAP.get(connectionId);
      if (!adminData) {
        // TODO report
        return;
      }

      const result =
        await clientToServerSchemas.adminReloadTab.safeParseAsync(data);
      if (!result.success) {
        return;
      }

      const currentUserData = SOCKET_USER_MAP.get(connectionId);
      const userData = SOCKET_USER_MAP.get(result.data.connectionId);

      if (userData) {
        try {
          const res = await userData.socket.emitWithAck("closeTab", {
            adminUserId: currentUserData?.user.id,
          });

          if (!res.success) {
            await createEvent({
              userId: currentUserData?.user.id,
              category: "admin",
              type: "reloadTab",
              action: "created",
              status: "failed",
              error: res.error,
              metadata: `admin:close-tab:${userData.user.email}`,
            });
            callback({ success: false, error: res.error });
            return;
          }

          if (!res.data.success) {
            await createEvent({
              userId: currentUserData?.user.id,
              category: "admin",
              type: "reloadTab",
              action: "created",
              status: "failed",
              error: res.data.error,
              metadata: `admin:close-tab:${userData.user.email}`,
            });
            callback({
              success: true,
              data: {
                success: false,
                error: res.data.error,
              },
            });
            return;
          }
          await createEvent({
            userId: currentUserData?.user.id,
            category: "admin",
            type: "reloadTab",
            action: "created",
            status: "success",
            metadata: `admin:close-tab:${userData.user.email}`,
          });
          callback({
            success: true,
            data: {
              success: true,
            },
          });
        } catch (error) {
          callback({ success: false, error: JSON.stringify(error) });
          await createEvent({
            userId: currentUserData?.user.id,
            category: "admin",
            type: "reloadTab",
            action: "created",
            status: "failed",
            error: JSON.stringify(error),
            metadata: `admin:close-tab:${userData.user.email}`,
          });
        }
      }
    });

    const sessionResult = await getUserSession({
      cookie: socket.request.headers.cookie,
      token: socket.handshake.auth.token,
    });
    if (!sessionResult.success) {
      return;
    }
    const session = sessionResult.data;
    if (!session) {
      return;
    }
    const user = await db.user.findFirst({
      where: {
        id: session.user.id,
      },
    });
    if (!user) {
      return;
    }

    SOCKET_USER_MAP.set(connectionId, {
      connectionId: connectionId,
      socket: socket,
      user: user,
      sessionId: session.id,
    });

    if (user.role === "admin" || user.role === "superadmin") {
      SOCKET_ADMIN_MAP.set(connectionId, {
        connectionId: connectionId,
        socket: socket,
        user: {
          id: user.id,
        },
        sessionId: session.id,
      });
    }

    // logger.verbose(`register-socket: ${userId}_${socket.id}`);

    const onlineUsers = getOnlineUsersData();
    emitToAdmins("onlineUsersData", {
      users: onlineUsers,
    });
  });
};
