import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import logger from "@fulltemplate/logger";

import { env } from "~/env";
import { io, setupSocketIO } from "~/lib/socket";

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

server.listen(env.PORT, () => {
  logger.info(`Server is running on port: ${env.PORT}`);
  void setupSocketIO();
});
