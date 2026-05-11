import { supabase } from "../../../services/supabaseClient";
import type { Database } from "../../../types/database";

type ActualizarPerfilInput = {
  userId: string;
  nombre: string;
  password?: string;
};

type UsuariosUpdateQuery = {
  update: (payload: Database["public"]["Tables"]["usuarios"]["Update"]) => {
    eq: (column: "id", value: string) => PromiseLike<{ error: Error | null }>;
  };
};

export async function actualizarPerfilEmpleada({ userId, nombre, password }: ActualizarPerfilInput) {
  const payload: Database["public"]["Tables"]["usuarios"]["Update"] = {
    nombre,
  };

  const usuariosQuery = supabase.from("usuarios") as unknown as UsuariosUpdateQuery;
  const { error: profileError } = await usuariosQuery.update(payload).eq("id", userId);

  if (profileError) {
    throw new Error("No se pudo actualizar el perfil.");
  }

  if (password) {
    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    if (authError) {
      throw new Error("El nombre se actualizo, pero no se pudo cambiar la contrasena.");
    }
  }
}
