import { jsonResponse } from "./http.ts";
import { getServiceClient } from "./supabase.ts";

export type AuthenticatedRequest = {
  user: {
    id: string;
    email?: string;
  };
  token: string;
};

export async function requireAuth(req: Request): Promise<AuthenticatedRequest | Response> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return jsonResponse({ error: "Missing bearer token" }, 401);
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    token,
  };
}

export async function requireAdmin(req: Request): Promise<AuthenticatedRequest | Response> {
  const auth = await requireAuth(req);

  if (auth instanceof Response) {
    return auth;
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Could not verify user role" }, 500);
  }

  if (data?.rol !== "admin") {
    return jsonResponse({ error: "Admin role is required" }, 403);
  }

  return auth;
}
