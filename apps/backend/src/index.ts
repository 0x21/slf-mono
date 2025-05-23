import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { kafkaProducer } from "@fulltemplate/kafka";
import logger from "@fulltemplate/logger";

import { env } from "~/env";
import { io, setupSocketIO } from "~/lib/socket";
import { initPorts } from "./lib/init";
import router from "./server/routes";

const app = express();
const server = http.createServer(app);
io.listen(server, {
  cors: {
    origin: ["http://localhost:3000", env.AUTH_URL],
    credentials: true,
  },
});

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", env.AUTH_URL],
    credentials: true,
  }),
);
app.use(cookieParser());

app.use(router);

void (async () => {
  try {
    await kafkaProducer.connect();
    logger.info(`Kafka producer connected to ${env.KAFKA_URL}`);
  } catch (err) {
    logger.error("Kafka producer connection Error", err);
  }

  try {
    await initPorts();
  } catch (err) {
    logger.error("Port init failed", err);
  }

  server.listen(env.PORT, () => {
    logger.info(`Server is running on port: ${env.PORT}`);
    void setupSocketIO();
  });
})();
