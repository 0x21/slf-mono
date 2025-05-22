import type { Result } from "./types";

export async function tryCatch<T, E>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error as E };
  }
}
