/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { Route } from "next";
import { createContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { clientToServerSchemas } from "@fulltemplate/socket";

import type { WithChildren } from "~/lib/types";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

interface ISocketContext {
  isConnected: boolean;
  isAuthenticated: boolean;
  isRegistered: boolean;
}

export const SocketContext = createContext<ISocketContext | undefined>(
  undefined,
);

export function SocketProvider({ children }: WithChildren) {
  const api = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  const queryClient = useQueryClient();
  // const mutation = api.public.registerSocket.useMutation();

  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const transportRef = useRef("N/A");

  // useEffect(() => {
  //   (async () => {
  //     const result = await getFingerprint();
  //     console.log(result);
  //   })();
  // }, []);

  // const authenticate = useCallback(async () => {
  //   if (!isConnected || session.status !== "authenticated") {
  //     return;
  //   }

  //   try {
  //     const result = await socket.emitWithAck("authenticate", {
  //       id: session.data.user.id,
  //       sessionId: session.data.id,
  //       pathname: pathname,
  //       focus: document.hasFocus(),
  //     });

  //     if (!result.success || !result.data) {
  //       // TODO
  //       return;
  //     }

  //     setIsAuthenticated(true);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [isConnected, session, pathname]);

  // useEffect(() => {
  //   if (!isConnected || session.status !== "authenticated") {
  //     return;
  //   }

  //   void authenticate();
  //   return () => {
  //     // @ts-expect-error
  //     socket.off("authenticate");
  //   };
  // }, [session, isConnected, pathname, authenticate]);

  // const registerSocket = useCallback(async () => {
  //   if (!socketId) {
  //     return;
  //   }
  //   if (isRegistered) {
  //     return;
  //   }
  //   if (mutation.isPending) {
  //     return;
  //   }
  //   try {
  //     await mutation.mutateAsync({
  //       id: socketId,
  //     });
  //     setIsRegistered(true);
  //   } catch (error) {
  //     setIsRegistered(false);
  //   }
  // }, [mutation, socketId, isRegistered]);

  // useEffect(() => {
  //   void registerSocket();
  // }, [isConnected, isRegistered, mutation.isPending, registerSocket, socketId]);

  useEffect(() => {
    // const onConnect = (data: { id: string }) => {
    //   setIsConnected(true);
    //   setSocketId(data.id);
    //   transportRef.current = socket.io.engine.transport.name;

    //   socket.io.engine.on("upgrade", (transport) => {
    //     transportRef.current = transport.name;
    //   });
    // };

    const onDisconnect = () => {
      // setIsConnected(false);
      // setSocketId(undefined);
      // setIsAuthenticated(false);
      transportRef.current = "N/A";
    };

    // socket.on("connected", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("navigate", async (data, callback) => {
      const result =
        await clientToServerSchemas.adminNavigateTab.safeParseAsync(data);
      if (!result.success) {
        callback({
          success: true,
          data: {
            success: false,
            error: "invalid-data",
          },
        });
        return;
      }
      try {
        let newWindow: Window | null = null;

        const openUrl = () => {
          if (data.url.startsWith("/")) {
            const fullUrl = `${window.location.origin}${data.url}`;
            return window.open(fullUrl, "_blank", "noreferrer");
          } else {
            return window.open(data.url, "_blank", "noreferrer");
          }
        };

        if (data.openNewTab) {
          newWindow = openUrl();
        } else {
          if (data.url.startsWith("/")) {
            router.push(data.url as Route);
          } else {
            window.location.assign(data.url);
          }
        }

        //TODO handle popup blocked
        if (data.openNewTab && !newWindow) {
          callback({
            success: true,
            data: {
              success: false,
              error: "popup-blocked",
            },
          });
          return;
        }
        callback({
          success: true,
          data: {
            success: true,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          callback({
            success: false,
            error: error.message,
          });
          return;
        }
        callback({
          success: false,
          error: "unexcepted-error",
        });
      }
    });
    socket.on("reloadTab", (data, callback) => {
      try {
        window.location.reload();
        callback({
          success: true,
          data: {
            success: true,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          callback({
            success: false,
            error: error.message,
          });
          return;
        }
        callback({
          success: false,
          error: "unexcepted-error",
        });
      }
    });
    socket.on("closeTab", (data, callback) => {
      try {
        window.close();

        if (!window.closed) {
          callback({
            success: true,
            data: {
              success: false,
              error: "tab-not-closed",
            },
          });
          return;
        }
        callback({
          success: true,
          data: {
            success: true,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          callback({
            success: false,
            error: error.message,
          });
          return;
        }
        callback({
          success: false,
          error: "unexcepted-error",
        });
      }
    });

    return () => {
      // socket.off("connected");
      socket.off("disconnect");
      socket.off("navigate");
      socket.off("reloadTab");
      socket.off("closeTab");
    };
  }, [router]);

  useEffect(() => {
    socket.on("sessionUpdated", async (data) => {
      if (data.role !== session.data?.user.role) {
        await queryClient.invalidateQueries(api.pathFilter());
        if (pathname.startsWith("/admin")) {
          router.push("/dashboard");
          toast.success(
            "Your role has been updated. Redirecting to dashboard.",
          );
        }
      }

      await session.update({
        ...session,
        user: {
          ...session.data,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.lastName,
          username: data.username,
          role: data.role,
          image: data.image,
        },
      });
    });

    return () => {
      socket.off("sessionUpdated");
    };
  }, [pathname, router, session]);

  useEffect(() => {
    // if (!isConnected) {
    //   return;
    // }
    socket.emit("pathname", {
      pathname: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    // if (!isConnected) {
    //   return;
    // }

    const onFocus = () => {
      socket.emit("focus", {
        focus: true,
      });
    };

    const onBlur = () => {
      socket.emit("focus", {
        focus: false,
      });
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    onFocus();

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected: isConnected,
        isAuthenticated: isAuthenticated,
        isRegistered: isRegistered,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
