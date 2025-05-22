import cron from "node-cron";

import logger from "@fulltemplate/logger";

export const scheduleAllActions = () => {
  logger.info({ message: "Cron is running" });

  cron.schedule("*/12 * * * *", () => {
    return;
  });

  cron.schedule("*/30 * * * *", () => {
    return;
  });
};
