import { expect, test } from "@playwright/test";

const profiles = [
  ["admin", "Administrador", "ADMIN"],
  ["recepcao1", "Recepcionista", "RECEPTIONIST"],
  ["profissional1", "Profissional de saúde", "PROFESSIONAL"],
];

test("protege a área administrativa e o endpoint de sessão", async ({
  page,
  request,
}) => {
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/entrar$/);
  expect((await request.get("/api/v1/session")).status()).toBe(401);
});

for (const [login, profile, role] of profiles) {
  test(`entra e sai como ${profile}`, async ({ page }) => {
    const password = process.env.DEMO_PASSWORD;
    if (!password)
      throw new Error(
        "Configure DEMO_PASSWORD e execute o seed em um banco de teste.",
      );

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(`${login}@clinicflow.example`);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.getByRole("heading", { name: "Clínica Vida Plena" }),
    ).toBeVisible();
    const hasFinancials = role === "ADMIN";
    await expect(
      page.getByText("Receita recebida", { exact: true }),
    ).toHaveCount(hasFinancials ? 1 : 0);
    await expect(
      page.getByText("Pacientes cadastrados", { exact: true }),
    ).toHaveCount(role === "PROFESSIONAL" ? 0 : 1);

    const session = await page.request.get("/api/v1/session");
    expect(session.status()).toBe(200);
    const { user } = await session.json();
    expect(user.role).toBe(role);
    if (role === "PROFESSIONAL") {
      const providers = page.locator(
        "#proximos-atendimentos li p:nth-of-type(2)",
      );
      await expect(providers.first()).toBeVisible();
      expect(new Set(await providers.allTextContents())).toEqual(
        new Set([user.name]),
      );
    }

    await page.getByLabel("Menu do perfil").click();
    await expect(
      page.getByText(profile, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    expect((await page.request.get("/api/v1/session")).status()).toBe(401);
  });
}
