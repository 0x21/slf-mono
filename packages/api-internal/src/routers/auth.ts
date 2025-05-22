import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  hashPassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.password, 12);
      return { success: true, data: hash };
    }),
  matchPassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        accountPassword: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const match = await bcrypt.compare(input.password, input.accountPassword);
      return { success: true, match: match };
    }),
  verifyTwoFactorAuth: protectedProcedure
    .input(
      z.object({
        secret: z.string(),
        token: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const verified = speakeasy.totp.verify({
        secret: input.secret,
        encoding: "base32",
        token: input.token,
        window: 1,
      });

      if (!verified) {
        return {
          success: false,
        };
      }
      return {
        success: true,
      };
    }),
  hashBackupCodes: protectedProcedure
    .input(
      z.object({
        codes: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const hashedCodes = await Promise.all(
        input.codes.map(async (code) => {
          return bcrypt.hash(code, 12);
        }),
      );

      return {
        success: true,
        data: hashedCodes,
      };
    }),
  matchBackupCodes: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        hashedCodes: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      for (const hashedCode of input.hashedCodes) {
        const match = await bcrypt.compare(input.code, hashedCode);
        if (match) {
          return {
            success: true,
            data: hashedCode,
          };
        }
      }

      return {
        success: false,
        msg: "No match found",
      };
    }),
});
