import { expect, test } from "@playwright/test";

test.describe("mesa de ayuda smoke flow", () => {
  test("renders public and protected unauthenticated flows with screenshots", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
    await page.screenshot({ path: "playwright-capturas/01-login-desktop.png", fullPage: true });

    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Ingresa tu email y contrasena para continuar.")).toBeVisible();
    await page.screenshot({ path: "playwright-capturas/02-login-validacion.png", fullPage: true });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
    await page.screenshot({ path: "playwright-capturas/03-admin-redirige-login.png", fullPage: true });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();

    await page.goto("/ruta-inexistente");
    await expect(page.getByRole("heading", { name: "Ruta no encontrada" })).toBeVisible();
    await page.screenshot({ path: "playwright-capturas/04-404.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
    await page.screenshot({ path: "playwright-capturas/05-login-mobile.png", fullPage: true });
  });
});
