import { db } from "@fulltemplate/db";
import { kafkaProducer } from "@fulltemplate/kafka";
import logger from "@fulltemplate/logger";

import type { ServiceResponse } from "~/types";
import { env } from "~/env";
import { getRandomAvailablePorts, releasePorts } from "~/lib/util";

interface CreateConnectionResult {
  id: string;
  address: string;
  externalPort: number;
  internalPort: number;
  status: string;
}

export const createConnection = async (
  apiKeyId: string,
): Promise<ServiceResponse<CreateConnectionResult>> => {
  try {
    const ports = await getRandomAvailablePorts(2);
    if (ports.length !== 2) {
      return {
        success: false,
        message: "No available ports",
        error: "no_ports_available",
      };
    }
    const connection = await db.connection.create({
      data: {
        address: env.SERVER_URL,
        externalPort: ports[0] ?? 0,
        internalPort: ports[1] ?? 0,
        apiKey: {
          connect: {
            id: apiKeyId,
          },
        },
        status: "connecting",
      },
    });

    await kafkaProducer.send({
      topic: "connection",
      messages: [
        {
          key: connection.id,
          value: JSON.stringify({
            type: "start",
            externalPort: connection.externalPort,
            internalPort: connection.internalPort,
            sessionId: connection.id,
          }),
        },
      ],
    });

    return {
      success: true,
      message: "Connection created successfully",
      data: {
        id: connection.id,
        address: connection.address,
        externalPort: connection.externalPort,
        internalPort: connection.internalPort,
        status: connection.status,
      },
    };
  } catch (error) {
    logger.error("Connection creation failed", error);
    return {
      success: false,
      message: "Connection creation failed",
      error: "server_error",
    };
  }
};

export const stopConnection = async (
  connectionId: string,
): Promise<ServiceResponse<boolean>> => {
  const connection = await db.connection.findUnique({
    where: {
      id: connectionId,
    },
  });
  if (!connection) {
    return {
      success: false,
      message: "Connection not found",
      error: "connection_not_found",
    };
  }
  if (connection.status !== "connecting" && connection.status !== "connected") {
    return {
      success: true,
      message: "Connection is not active",
      data: true,
    };
  }
  await db.connection.update({
    where: {
      id: connectionId,
    },
    data: {
      status: "stopped",
    },
  });
  await kafkaProducer.send({
    topic: "connection",
    messages: [
      {
        key: connection.id,
        value: JSON.stringify({
          type: "stop",
          externalPort: connection.externalPort,
          internalPort: connection.internalPort,
          sessionId: connection.id,
        }),
      },
    ],
  });

  await releasePorts([connection.externalPort, connection.internalPort]);

  return {
    success: true,
    message: "Connection stopped successfully",
    data: true,
  };
};

export const updateConnectionStatus = async (
  connectionId: string,
  status: string,
): Promise<ServiceResponse<boolean>> => {
  const connection = await db.connection.findUnique({
    where: {
      id: connectionId,
    },
  });
  if (!connection) {
    return {
      success: false,
      message: "Connection not found",
      error: "connection_not_found",
    };
  }
  await db.connection.update({
    where: {
      id: connectionId,
    },
    data: {
      status,
    },
  });

  return {
    success: true,
    message: "Connection status updated successfully",
    data: true,
  };
};
