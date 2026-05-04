import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AuthenticatedRequest = {
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
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase environment is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    token,
  };
}
