import { Router } from "express";

import { authenticateApiKey } from "~/server/middlewares/auth";
import connectionRoutes from "./connection";

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticateApiKey);

router.use("/connection", connectionRoutes);

export default router;
