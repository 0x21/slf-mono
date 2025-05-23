import type { Request, Response } from "express";

import * as connectionService from "../services/connection.service";

export const createConnection = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!res.locals.apiKey) {
    res.status(401).json({ error: "Unauthorized" });
  }
  const connection = await connectionService.createConnection();

  res.json({ message: connection.data.status });
};
