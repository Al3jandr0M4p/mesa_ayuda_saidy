import { expect, type Page, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const ADMIN_EMAIL = "test2@example.co";
const PROVIDED_EMPLOYEE_EMAIL = "maximoalgenysmoracandelario@gmail.com";
const PASSWORD = "123456789";
const CAPTURE_DIR = "playwright-capturas/full-flow";

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const now = "2026-05-11T15:00:00.000Z";
const runLabel = `PW ${stamp}`;
const ticketTitle = `Ticket prueba ${runLabel}`;
const eventTitle = `Reunion prueba ${runLabel}`;
const testUserName = `Empleado Playwright ${runLabel}`;
const testUserEmail = `playwright.${stamp}@example.com`;
const updatedTestUserName = `${testUserName} editado`;

const envText = readFileSync(".env", "utf8");
const supabaseUrl = envText.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim() ?? "https://missing-project.supabase.co";
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const authStorageKey = `sb-${projectRef}-auth-token`;

type Role = "admin" | "empleado";

const adminProfile = {
  id: "mock-admin-id",
  nombre: "Admin Playwright",
  email: ADMIN_EMAIL,
  rol: "admin" as Role,
  created_at: now,
  updated_at: now,
};

const employeeProfile = {
  id: "mock-employee-id",
  nombre: testUserName,
  email: `mock.employee.${stamp}@example.com`,
  rol: "empleado" as Role,
  created_at: now,
  updated_at: now,
};

let tickets = [
  {
    id: "ticket-existing",
    titulo: "Ticket existente de muestra",
    descripcion: "Registro precargado para probar seleccion y estados.",
    prioridad: "media",
    estado: "abierto",
    user_id: employeeProfile.id,
    created_at: now,
    updated_at: now,
    usuarios: { nombre: employeeProfile.nombre, email: employeeProfile.email, rol: "empleado" },
  },
];

let comments = [
  {
    id: "comment-existing",
    ticket_id: "ticket-existing",
    user_id: employeeProfile.id,
    mensaje: "Comentario precargado para validar historial.",
    created_at: now,
    usuarios: { nombre: employeeProfile.nombre, email: employeeProfile.email },
  },
];

let events = [
  {
    id: "event-existing",
    titulo: "Reunion existente",
    descripcion: "Evento precargado visible para empleados.",
    fecha: "2026-05-12T14:00:00.000Z",
    plataforma: "google_meet",
    enlace_reunion: "https://meet.google.com/test-demo",
    created_at: now,
  },
];

let users = [adminProfile, employeeProfile];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${CAPTURE_DIR}/${name}.png`, fullPage: true });
}

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByPlaceholder("Tu contrasena").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function setMockSession(page: Page, profile: typeof adminProfile | typeof employeeProfile) {
  const session = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    user: {
      id: profile.id,
      email: profile.email,
      aud: "authenticated",
      role: "authenticated",
    },
  };

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: authStorageKey, value: session },
  );

  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: authStorageKey, value: session },
  ).catch(() => undefined);
}

async function setupMockSupabase(page: Page) {
  const json = (data: unknown, status = 200) => ({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });

  await page.route("**/auth/v1/logout**", async (route) => {
    await route.fulfill(json({}));
  });

  await page.route("**/rest/v1/usuarios**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "PATCH") {
      await route.fulfill(json([]));
      return;
    }

    const id = url.searchParams.get("id")?.replace("eq.", "");
    const user = users.find((item) => item.id === id) ?? adminProfile;
    await route.fulfill(json(user));
  });

  await page.route("**/rest/v1/eventos**", async (route) => {
    await route.fulfill(json(events));
  });

  await page.route("**/rest/v1/tickets**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "POST") {
      const [payload] = JSON.parse(request.postData() ?? "[]");
      const created = {
        id: `ticket-${tickets.length + 1}`,
        ...payload,
        created_at: now,
        updated_at: now,
      };
      tickets = [created, ...tickets];
      await route.fulfill(json(created));
      return;
    }

    const ticketId = url.searchParams.get("id")?.replace("eq.", "");
    if (ticketId) {
      await route.fulfill(json(tickets.find((ticket) => ticket.id === ticketId) ?? null));
      return;
    }

    const userId = url.searchParams.get("user_id")?.replace("eq.", "");
    await route.fulfill(json(tickets.filter((ticket) => !userId || ticket.user_id === userId)));
  });

  await page.route("**/rest/v1/comentarios**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "POST") {
      const [payload] = JSON.parse(request.postData() ?? "[]");
      const created = {
        id: `comment-${comments.length + 1}`,
        ...payload,
        created_at: now,
      };
      comments = [...comments, created];
      await route.fulfill(json(created));
      return;
    }

    const ticketId = url.searchParams.get("ticket_id")?.replace("eq.", "");
    await route.fulfill(json(comments.filter((comment) => !ticketId || comment.ticket_id === ticketId)));
  });

  await page.route("**/functions/v1/quick-function**", async (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill(json({ users, tickets, comments, events }));
      return;
    }

    const body = JSON.parse(request.postData() ?? "{}");

    if (body.action === "create-event") {
      const created = {
        id: `event-${events.length + 1}`,
        titulo: body.titulo,
        descripcion: body.descripcion,
        fecha: body.fecha,
        plataforma: body.plataforma,
        enlace_reunion: body.enlace_reunion,
        created_at: now,
      };
      events = [...events, created];
      await route.fulfill(json({ event: created }));
      return;
    }

    if (body.action === "add-comment") {
      const created = {
        id: `admin-comment-${comments.length + 1}`,
        ticket_id: body.ticket_id,
        user_id: adminProfile.id,
        mensaje: body.mensaje,
        created_at: now,
        usuarios: { nombre: adminProfile.nombre, email: adminProfile.email },
      };
      comments = [...comments, created];
      await route.fulfill(json({ comment: created }));
      return;
    }

    if (body.action === "update-ticket-status") {
      tickets = tickets.map((ticket) => (ticket.id === body.id ? { ...ticket, estado: body.estado } : ticket));
      await route.fulfill(json({ ticket: tickets.find((ticket) => ticket.id === body.id) }));
      return;
    }

    await route.fulfill(json({ error: "Accion no soportada" }, 400));
  });

  await page.route("**/functions/v1/admin-users**", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");

    if (body.action === "create-user") {
      const created = {
        id: "created-user-id",
        nombre: body.nombre,
        email: body.email,
        rol: body.rol,
        created_at: now,
        updated_at: now,
      };
      users = [created, ...users];
      await route.fulfill(json({ user: created }));
      return;
    }

    if (body.action === "update-user") {
      users = users.map((user) => (user.id === body.id ? { ...user, nombre: body.nombre, email: body.email, rol: body.rol } : user));
      await route.fulfill(json({ user: users.find((user) => user.id === body.id) }));
      return;
    }

    if (body.action === "delete-user") {
      users = users.filter((user) => user.id !== body.id);
      await route.fulfill(json({ ok: true }));
      return;
    }

    await route.fulfill(json({ error: "Accion no soportada" }, 400));
  });
}

test.describe.serial("full creation and failure flow", () => {
  test("captures the provided real credentials failing", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 1100 });

    await page.goto("/login");
    await shot(page, "01-login-inicial");

    await submitLogin(page, "correo-invalido@example.com", "password-equivocado");
    await expect(page.getByText(/Credenciales incorrectas|Invalid login credentials/i)).toBeVisible({ timeout: 20_000 });
    await shot(page, "02-login-credenciales-invalidas-error");

    await submitLogin(page, PROVIDED_EMPLOYEE_EMAIL, PASSWORD);
    await expect(page.getByText(/Credenciales incorrectas|Invalid login credentials/i)).toBeVisible({ timeout: 30_000 });
    await shot(page, "03-login-usuario-proporcionado-falla-error");

    await submitLogin(page, ADMIN_EMAIL, PASSWORD);
    await expect(page.getByText(/Credenciales incorrectas|Invalid login credentials/i)).toBeVisible({ timeout: 30_000 });
    await shot(page, "04-login-admin-proporcionado-falla-error");
  });

  test("runs creation and error flows with mocked Supabase responses", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 1100 });
    await setupMockSupabase(page);
    await setMockSession(page, adminProfile);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible({ timeout: 25_000 });
    await shot(page, "05-admin-dashboard-mock-ok");

    await page.getByRole("button", { name: "Crear usuario" }).click();
    await expect(page.getByText("Completa nombre y email del usuario.")).toBeVisible();
    await shot(page, "06-admin-usuario-vacio-error");

    await page.getByLabel("Nombre").fill(testUserName);
    await page.getByLabel("Email").fill(testUserEmail);
    await page.getByLabel("Password inicial").fill("123");
    await page.getByRole("button", { name: "Crear usuario" }).click();
    await expect(page.getByText("La password debe tener al menos 6 caracteres.")).toBeVisible();
    await shot(page, "07-admin-usuario-password-corta-error");

    await page.getByLabel("Password inicial").fill(PASSWORD);
    await page.getByRole("button", { name: "Crear usuario" }).click();
    await expect(page.getByText("Usuario creado.")).toBeVisible();
    await expect(page.getByText(testUserEmail).first()).toBeVisible();
    await shot(page, "08-admin-usuario-creado-ok");

    await page.getByLabel("Nombre").fill(updatedTestUserName);
    await page.getByRole("button", { name: "Actualizar usuario" }).click();
    await expect(page.getByText("Usuario actualizado.")).toBeVisible();
    await expect(page.getByText(updatedTestUserName).first()).toBeVisible();
    await shot(page, "09-admin-usuario-actualizado-ok");

    await page.getByRole("button", { name: "Crear reunion" }).click();
    await expect(page.getByText("Completa titulo, descripcion y fecha del evento.")).toBeVisible();
    await shot(page, "10-admin-reunion-vacia-error");

    const eventForm = page.locator("form").filter({ hasText: "Crear reunion" });
    await eventForm.getByLabel("Titulo").fill(eventTitle);
    await eventForm.getByLabel("Descripcion").fill(`Reunion de prueba creada por Playwright. Marca: ${runLabel}`);
    await eventForm.getByLabel("Fecha").fill("2026-05-15T10:30");
    await eventForm.getByLabel("Plataforma").selectOption("zoom");
    await page.getByRole("button", { name: "Crear reunion" }).click();
    await expect(page.getByText("Agrega el enlace de la reunion para la plataforma seleccionada.")).toBeVisible();
    await shot(page, "11-admin-reunion-zoom-sin-enlace-error");

    await page.getByLabel("Enlace de reunion").fill("https://zoom.us/j/123456789");
    await page.getByRole("button", { name: "Crear reunion" }).click();
    await expect(page.getByText("Reunion publicada correctamente.")).toBeVisible();
    await expect(page.getByText(eventTitle).first()).toBeVisible();
    await shot(page, "12-admin-reunion-creada-ok");

    await setMockSession(page, employeeProfile);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Gestiona tus solicitudes/i })).toBeVisible({ timeout: 25_000 });
    await shot(page, "13-empleado-dashboard-mock-ok");

    await page.getByRole("button", { name: "Crear ticket" }).click();
    await expect(page.getByText("Completa el titulo y la descripcion del ticket.")).toBeVisible();
    await shot(page, "14-empleado-ticket-vacio-error");

    await page.getByLabel("Titulo").fill(ticketTitle);
    await page.getByLabel("Descripcion").fill(`Ticket creado por Playwright. Marca: ${runLabel}`);
    await page.getByLabel("Prioridad").selectOption("alta");
    await page.getByRole("button", { name: "Crear ticket" }).click();
    await expect(page.getByText("Ticket creado correctamente con estado Pendiente.")).toBeVisible();
    await expect(page.getByRole("link", { name: ticketTitle })).toBeVisible();
    await shot(page, "15-empleado-ticket-creado-ok");

    await page.getByLabel("Nueva contrasena").fill("123");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("La nueva contrasena debe tener al menos 8 caracteres.")).toBeVisible();
    await shot(page, "16-empleado-perfil-password-corta-error");

    await page.getByRole("link", { name: ticketTitle }).click();
    await expect(page.getByRole("heading", { name: ticketTitle })).toBeVisible();
    await shot(page, "17-empleado-detalle-ticket");

    await page.getByRole("button", { name: "Agregar comentario" }).click();
    await expect(page.getByText("Escribe un comentario antes de enviarlo.")).toBeVisible();
    await shot(page, "18-empleado-comentario-vacio-error");

    await page.getByLabel("Nuevo comentario").fill(`Comentario empleado generado por Playwright: ${runLabel}`);
    await page.getByRole("button", { name: "Agregar comentario" }).click();
    await expect(page.getByText("Comentario enviado correctamente.")).toBeVisible();
    await shot(page, "19-empleado-comentario-creado-ok");

    await setMockSession(page, adminProfile);
    await page.goto("/admin");
    await expect(page.getByText(ticketTitle).first()).toBeVisible();
    await page.getByText(ticketTitle).first().click();
    await expect(page.getByRole("heading", { name: ticketTitle }).nth(1)).toBeVisible();
    await shot(page, "20-admin-ticket-seleccionado");

    const commentForm = page.locator("form").filter({ hasText: "Nuevo comentario" });
    await commentForm.getByRole("button", { name: "Agregar comentario" }).click();
    await expect(page.getByText("Escribe un comentario antes de enviarlo.")).toBeVisible();
    await shot(page, "21-admin-comentario-vacio-error");

    await commentForm.getByLabel("Nuevo comentario").fill(`Comentario admin generado por Playwright: ${runLabel}`);
    await commentForm.getByRole("button", { name: "Agregar comentario" }).click();
    await expect(page.getByText("Comentario agregado al ticket.")).toBeVisible();
    await shot(page, "22-admin-comentario-creado-ok");

    const selectedTicket = page.locator("article", { hasText: ticketTitle }).first();
    await selectedTicket.getByRole("combobox").selectOption("en_progreso");
    await expect(page.getByText("Estado del ticket actualizado.")).toBeVisible();
    await shot(page, "23-admin-ticket-en-progreso-ok");

    await page.getByText(testUserEmail).click();
    await page.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Usuario eliminado.")).toBeVisible();
    await shot(page, "24-admin-usuario-eliminado-ok");
  });
});
