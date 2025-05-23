import { db } from "@fulltemplate/db";

export const createConnection = async () => {
  const connection = await db.connection.create({
    data: {
      address: "",
      externalPort: "",
      internalPort: "",
      apiKey: {
        connect: {
          id: "",
        },
      },
      status: "connecting",
    },
  });
  return {
    message: "Projects list",
    data: {
      address: "",
      externalPort: connection.externalPort,
      internalPort: connection.internalPort,
      status: "connecting",
    },
  };
};
