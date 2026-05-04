import { supabase } from "./supabaseClient";

type ProtectedTestResponse = {
  ok: boolean;
  message: string;
  user: {
    id: string;
    email?: string;
  };
};

export async function callProtectedTest() {
  const { data, error } = await supabase.functions.invoke<ProtectedTestResponse>("protected-test", {
    method: "GET",
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
