import crypto from "crypto";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    ENCRYPTION_KEY: z.string(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 12;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
};

export const decrypt = (encryptedText: string): string => {
  const [ivPart, encryptedPart, authTagPart] = encryptedText.split(":");
  if (!ivPart || !encryptedPart || !authTagPart) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(ivPart, "hex");
  const authTag = Buffer.from(authTagPart, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedPart, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
