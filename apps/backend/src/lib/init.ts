import { db } from "@fulltemplate/db";
import logger from "@fulltemplate/logger";

import { env } from "~/env";

export const initPorts = async () => {
  const startPort = env.PORTRANGEMIN;
  const endPort = env.PORTRANGEMAX;

  const tasks = [];

  for (
    let port = parseInt(startPort, 10);
    port <= parseInt(endPort, 10);
    port++
  ) {
    tasks.push(
      db.portPool.upsert({
        where: { port },
        update: {},
        create: {
          port,
          reserved: false,
          reservedAt: new Date(),
        },
      }),
    );
  }

  await Promise.all(tasks);

  logger.info(
    `Port range ${startPort}-${endPort} initialized in the database.`,
  );
};
