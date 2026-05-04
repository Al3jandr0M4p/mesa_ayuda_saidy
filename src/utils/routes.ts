import type { UserRole } from "../types/database";

export const getDashboardPath = (role: UserRole | null) => {
  if (role === "admin") {
    return "/admin";
  }

  return "/dashboard";
};
