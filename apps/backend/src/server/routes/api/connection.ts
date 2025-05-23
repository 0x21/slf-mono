/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";

import * as connectionController from "~/server/controllers/connection.controller";

const router = Router();

router.post("/", connectionController.createConnectionHandler);
router.delete("/:id", connectionController.stopConnectionHandler);
router.patch("/:id", connectionController.updateConnectionHandler);

export default router;
