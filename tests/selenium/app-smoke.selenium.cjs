const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawn } = require("node:child_process");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const ROOT = path.resolve(__dirname, "..", "..");
const CAPTURE_DIR = path.join(ROOT, "selenium-capturas");
const BASE_URL = "http://127.0.0.1:4174";
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function waitForPreview() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/login`);
      if (response.ok) return;
    } catch {
      // Vite preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("vite preview no respondio en http://127.0.0.1:4174/login");
}

function startPreview() {
  return spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run preview -- --host 127.0.0.1 --port 4174"], {
    cwd: ROOT,
    shell: false,
    stdio: "pipe",
    windowsHide: true,
  });
}

function stopPreview(preview) {
  if (!preview?.pid) return;
  try {
    execFileSync("taskkill.exe", ["/pid", String(preview.pid), "/t", "/f"], { stdio: "ignore" });
  } catch {
    preview.kill();
  }
}

async function screenshot(driver, name) {
  const image = await driver.takeScreenshot();
  fs.writeFileSync(path.join(CAPTURE_DIR, `${name}.png`), image, "base64");
}

async function expectHeading(driver, text) {
  const heading = await driver.wait(until.elementLocated(By.xpath(`//h1[normalize-space()="${text}"] | //h2[normalize-space()="${text}"]`)), 10_000);
  await driver.wait(until.elementIsVisible(heading), 10_000);
}

(async () => {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });

  const preview = startPreview();
  let driver;

  try {
    await waitForPreview();
    const options = new chrome.Options()
      .addArguments("--headless=new")
      .addArguments("--window-size=1440,1000")
      .addArguments("--disable-gpu");

    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    await driver.get(`${BASE_URL}/login`);
    await expectHeading(driver, "Iniciar sesion");
    await screenshot(driver, "01-login-desktop");
    record("Carga de login", "PASS", "Se mostro la pantalla de inicio de sesion.");

    await driver.findElement(By.xpath("//button[normalize-space()='Entrar']")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(normalize-space(), 'Ingresa tu email y contrasena para continuar.')]")), 10_000);
    await screenshot(driver, "02-login-validacion");
    record("Validacion de formulario vacio", "PASS", "La app mostro el mensaje esperado.");

    await driver.get(`${BASE_URL}/admin`);
    await driver.wait(until.urlMatches(/\/login$/), 10_000);
    await expectHeading(driver, "Iniciar sesion");
    await screenshot(driver, "03-admin-redirige-login");
    record("Proteccion de /admin", "PASS", "La ruta protegida redirigio a /login.");

    await driver.get(`${BASE_URL}/ruta-inexistente`);
    await expectHeading(driver, "Ruta no encontrada");
    await screenshot(driver, "04-404");
    record("Ruta 404", "PASS", "La app mostro la pagina de ruta no encontrada.");

    await driver.manage().window().setRect({ width: 390, height: 844 });
    await driver.get(`${BASE_URL}/login`);
    await expectHeading(driver, "Iniciar sesion");
    await screenshot(driver, "05-login-mobile");
    record("Login responsive movil", "PASS", "La pantalla de login cargo en viewport movil.");

    fs.writeFileSync(
      path.join(CAPTURE_DIR, "selenium-results.json"),
      JSON.stringify({ status: "PASS", baseUrl: BASE_URL, results }, null, 2),
    );
  } catch (error) {
    record("Ejecucion Selenium", "FAIL", error.message);
    fs.writeFileSync(
      path.join(CAPTURE_DIR, "selenium-results.json"),
      JSON.stringify({ status: "FAIL", baseUrl: BASE_URL, results, error: error.stack }, null, 2),
    );
    process.exitCode = 1;
  } finally {
    if (driver) await driver.quit();
    stopPreview(preview);
  }
})();
