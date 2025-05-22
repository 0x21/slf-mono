import { customAlphabet } from "nanoid";

export const generateNanoId = (length = 8): string => {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
};
