import { db } from "@fulltemplate/db";

export const getRandomAvailablePorts = async (
  count: number,
): Promise<number[]> => {
  const allAvailable = await db.portPool.findMany({
    where: {
      reserved: false,
    },
    select: {
      port: true,
    },
  });

  if (allAvailable.length < count) {
    throw new Error("Not enough available ports");
  }

  const shuffled = allAvailable
    .map((p) => p.port)
    .sort(() => Math.random() - 0.5);

  const selectedPorts = shuffled.slice(0, count);

  await db.$transaction(
    selectedPorts.map((port) =>
      db.portPool.update({
        where: { port },
        data: {
          reserved: true,
          reservedAt: new Date(),
          releasedAt: null,
        },
      }),
    ),
  );

  return selectedPorts;
};

export const releasePorts = async (ports: number[]) => {
  await db.portPool.updateMany({
    where: {
      port: { in: ports },
    },
    data: {
      reserved: false,
      releasedAt: new Date(),
    },
  });
};
