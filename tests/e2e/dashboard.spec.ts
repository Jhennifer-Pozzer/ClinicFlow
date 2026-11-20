import { expect, test } from "@playwright/test";

test("landing responsiva com navegação, FAQ e acesso ao login", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 830 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A rotina da sua clínica",
  );
  await expect(
    page.getByRole("img", { name: /Recepcionista e coordenadora/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: /Recepcionista e coordenadora/ })
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await expect(page.getByText("Prévia com valores ilustrativos")).toBeVisible();
  await page
    .getByText("Preciso criar uma conta para experimentar?", { exact: true })
    .click();
  await expect(
    page.getByText("O acesso direto à Clínica Vida Plena", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.setViewportSize({ width: 768, height: 900 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(768);
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar no ClinicFlow" }),
  ).toBeVisible();
});

test("demonstração carrega dados, aplica o período e navega pela busca", async ({
  page,
}) => {
  test.skip(
    process.env.DEMO_ACCESS_ENABLED !== "true",
    "Habilite o acesso demonstrativo para testar a entrada direta.",
  );
  await page.goto("/");
  await page
    .getByRole("link", { name: "Experimentar demonstração" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Acessar painel demonstrativo" })
    .click();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(
    page.getByRole("heading", { name: "Clínica Vida Plena", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Período", { exact: true }).selectOption("7");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/periodo=7$/);
  const completed = page
    .locator("dl > div")
    .filter({ has: page.getByText("Consultas realizadas", { exact: true }) })
    .locator("dd span")
    .first();
  await expect(completed).toHaveText(/^\d+$/);
  const sevenDays = Number(await completed.innerText());

  await page.getByLabel("Período", { exact: true }).selectOption("90");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/periodo=90$/);
  await expect
    .poll(async () => Number(await completed.innerText()))
    .toBeGreaterThan(sevenDays);
  await expect(
    page.getByRole("heading", { name: "Receita mensal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Consultas por especialidade" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Buscar no painel" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("horarios");
  await dialog.getByRole("link", { name: "Agenda do dia" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/periodo=90#agenda-do-dia$/);
  await expect(
    page.getByRole("heading", { name: "Agenda do dia", exact: true }),
  ).toBeVisible();

  await page.getByLabel(/^Notificações/).click();
  await expect(page.getByText("Notificações", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Notificações", { exact: true })).toBeHidden();

  await page.setViewportSize({ width: 375, height: 830 });
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
});
