import type { UserRole } from "./types";

export const ensureUserHasHigherRole = (
  requesterRole: UserRole,
  targetRole: UserRole,
) => {
  if (requesterRole === "superadmin") {
    if (targetRole === "superadmin") {
      return false;
    }
    return true;
  }

  if (requesterRole === "admin") {
    if (targetRole === "superadmin" || targetRole === "admin") {
      return false;
    }
    return true;
  }
};
