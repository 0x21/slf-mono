import type { NextFunction, Request, Response } from "express";

import { db } from "@fulltemplate/db";

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({ error: "API key missing" });
  }

  try {
    const apiKeyRecord = await db.apiKey.findUnique({
      where: { token: apiKey },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    if (apiKeyRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: "API key expired" });
    }

    res.locals.apiKey = apiKeyRecord;

    return next();
  } catch (error) {
    console.error("API key auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
