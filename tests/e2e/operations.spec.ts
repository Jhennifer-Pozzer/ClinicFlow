import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, account: string) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("Configure DEMO_PASSWORD e execute o seed.");
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(`${account}@clinicflow.example`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

function nextMonday() {
  const localDay = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const date = new Date(localDay);
  date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7 || 7) + 7);
  return date.toISOString().slice(0, 10);
}

test("recepção cadastra, busca, edita e arquiva paciente", async ({ page }) => {
  await login(page, "recepcao1");
  const code = `TEST-${randomUUID().slice(0, 8)}`;
  const name = `Paciente fictício ${code}`;
  await page.getByRole("link", { name: "Novo paciente" }).click();
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Data de nascimento").fill("1990-08-21");
  await page.getByLabel("Identificador interno").fill(code);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Histórico de agendamentos" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Voltar para pacientes" }).click();
  await page.getByLabel("Buscar por nome").fill(code);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByLabel("Identificador interno")).toHaveValue(
    code.toUpperCase(),
  );
  await page.getByLabel("Telefone").fill("(11) 99999-0000");
  await page.getByLabel("Paciente ativo").uncheck();
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByLabel("Paciente ativo")).not.toBeChecked();
  await page.getByRole("link", { name: "Voltar para pacientes" }).click();
  await page.getByLabel("Buscar por nome").fill(code);
  await page.getByLabel("Situação").selectOption("inactive");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(
    page.getByText("(11) 99999-0000").filter({ visible: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/v1/profissionais")).status()).toBe(403);
});

test("admin cadastra a equipe e agenda, confirma, reagenda e cancela", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await login(page, "admin");
  const suffix = randomUUID().slice(0, 8);
  const specialty = `Especialidade ${suffix}`;
  const professional = `Profissional ${suffix}`;
  const service = `Serviço ${suffix}`;

  await page.goto("/especialidades/novo");
  await page.getByLabel("Nome", { exact: true }).fill(specialty);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: specialty, exact: true }),
  ).toBeVisible();

  await page.goto("/profissionais/novo");
  await page.getByLabel("Nome", { exact: true }).fill(professional);
  await page
    .getByLabel("Registro profissional fictício")
    .fill(`TEST-${suffix}`);
  await page
    .getByLabel("Especialidade", { exact: true })
    .selectOption({ label: specialty });
  await page.getByLabel("Duração padrão (min)").fill("30");
  await page.getByRole("button", { name: "Adicionar horário" }).click();
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: professional, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver agenda individual" }),
  ).toBeVisible();

  await page.goto("/servicos/novo");
  await page.getByLabel("Nome", { exact: true }).fill(service);
  await page.getByLabel("Descrição").fill("Atendimento fictício da validação.");
  await page
    .getByLabel("Especialidade", { exact: true })
    .selectOption({ label: specialty });
  await page.getByLabel("Duração (min)").fill("30");
  await page.getByLabel("Valor em reais").fill("150,00");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: service, exact: true }),
  ).toBeVisible();

  const day = nextMonday();
  await page.goto(`/agenda/novo?data=${day}`);
  await page
    .getByLabel("Paciente", { exact: true })
    .selectOption({ label: "Ana Almeida · PAC-001" });
  await page
    .getByLabel("Profissional", { exact: true })
    .selectOption({ label: professional });
  await page
    .getByLabel("Serviço", { exact: true })
    .selectOption({ label: `${service} · 30 min` });
  await page.getByRole("button", { name: "Consultar horários" }).click();
  await expect(page.getByText(/horários disponíveis/)).toBeVisible();
  await page.getByLabel("Horário", { exact: true }).selectOption("08:00");
  await page.getByRole("button", { name: "Salvar agendamento" }).click();
  await expect(
    page.getByRole("heading", { name: "Ana Almeida" }),
  ).toBeVisible();
  await expect(page.getByText("Agendamento criado · Agendado")).toBeVisible();

  await page.getByLabel("Ação").selectOption("CONFIRMED");
  await page.getByRole("button", { name: "Atualizar situação" }).click();
  await expect(
    page.getByText("Situação atualizada · Confirmado"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Consultar horários" }).click();
  await expect(page.getByText(/horários disponíveis/)).toBeVisible();
  await page.getByLabel("Horário", { exact: true }).selectOption("09:00");
  await page.getByRole("button", { name: "Salvar agendamento" }).click();
  await expect(
    page.getByText("Agendamento reagendado · Agendado"),
  ).toBeVisible();

  await page.getByLabel("Ação").selectOption("CANCELLED");
  await page.getByRole("button", { name: "Atualizar situação" }).click();
  await expect(page.getByText("Situação atualizada · Cancelado")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Editar ou reagendar" }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Voltar para agenda" }).click();
  await page.getByRole("link", { name: "Mês", exact: true }).click();
  await expect(page.getByLabel("Calendário mensal")).toBeVisible();
  await page.getByRole("link", { name: "Semana", exact: true }).click();
  await expect(page.getByLabel("Horários da agenda")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 830 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
});

test("profissional tem somente a própria agenda e não pode criar reservas", async ({
  page,
}) => {
  await login(page, "profissional1");
  await page.goto("/agenda");
  await expect(
    page.getByRole("heading", { name: "Minha agenda" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Novo agendamento" }),
  ).toHaveCount(0);
  const response = await page.request.get("/api/v1/agenda");
  expect(response.status()).toBe(200);
  const { appointments } = await response.json();
  expect(appointments.length).toBeGreaterThan(0);
  expect(
    new Set(
      appointments.map(
        (row: { professional: { name: string } }) => row.professional.name,
      ),
    ),
  ).toEqual(new Set(["Helena Monteiro"]));
  const key = randomUUID();
  expect(
    (
      await page.request.post("/api/v1/agenda", {
        data: {
          requestKey: key,
          patientId: key,
          professionalId: key,
          serviceId: key,
          day: nextMonday(),
          time: "09:00",
        },
      })
    ).status(),
  ).toBe(403);
});
