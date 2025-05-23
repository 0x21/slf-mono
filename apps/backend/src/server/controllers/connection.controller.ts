/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Request, Response } from "express";

import * as connectionService from "../services/connection.service";

export const createConnectionHandler = async (req: Request, res: Response) => {
  if (!res.locals.apiKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: "unauthorized",
    });
  }
  const result = await connectionService.createConnection(
    res.locals.apiKey.id as string,
  );

  if (!result.success) {
    switch (result.error) {
      case "no_ports_available":
        return res.status(503).json(result);
      case "validation_error":
        return res.status(400).json(result);
      default:
        return res.status(500).json(result);
    }
  }

  return res.status(201).json(result);
};

export const stopConnectionHandler = async (req: Request, res: Response) => {
  if (!res.locals.apiKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: "unauthorized",
    });
  }
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Bad request",
      error: "missing_id",
    });
  }

  const result = await connectionService.stopConnection(req.params.id);

  if (!result.success) {
    switch (result.error) {
      case "not_found":
        return res.status(404).json(result);
      default:
        return res.status(500).json(result);
    }
  }

  return res.status(200).json(result);
};

export const updateConnectionHandler = async (req: Request, res: Response) => {
  if (!res.locals.apiKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: "unauthorized",
    });
  }
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Bad request",
      error: "missing_id",
    });
  }

  const result = await connectionService.updateConnectionStatus(
    req.params.id,
    req.body.status as string,
  );

  if (!result.success) {
    switch (result.error) {
      case "not_found":
        return res.status(404).json(result);
      default:
        return res.status(500).json(result);
    }
  }

  return res.status(200).json(result);
};
