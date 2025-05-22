export type UserRole = "user" | "admin" | "superadmin" | "internal";

// returned type to the browser
export interface UserSession {
  id: string;
  sessionToken: string;
  expires: string;
  impersonatedById?: string | null | undefined;
  user: {
    id: string;
    username: string | null | undefined;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    role: string | null | undefined;
  };
}
