import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en el archivo .env."
    : null;

export const supabase = createClient<Database>(
  supabaseUrl || "https://missing-project.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
