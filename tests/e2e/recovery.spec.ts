import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword } from "../../src/server/auth/password";
import { database } from "../../src/server/db";

test("redefine a senha por e-mail, revoga a sessão e consome o token", async ({
  browser,
  page,
  request,
}) => {
  const mailpit = process.env.E2E_MAILPIT_URL;
  test.skip(
    !mailpit,
    "Configure E2E_MAILPIT_URL para validar a entrega de e-mail.",
  );
  const db = database();
  const { id: organizationId } = await db.organization.findUniqueOrThrow({
    where: { slug: "clinica-vida-plena" },
  });
  const email = `recovery-${randomUUID()}@clinicflow.example`;
  const oldPassword = randomUUID();
  const password = randomUUID();
  const user = await db.user.create({
    data: {
      name: "Conta fictícia de recuperação",
      organizationId,
      email,
      role: "RECEPTIONIST",
      passwordHash: await hashPassword(oldPassword),
    },
  });
  const other = await browser.newContext();

  try {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(oldPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/painel$/);

    const recovery = await other.newPage();
    await recovery.goto("/recuperar-senha");
    await recovery.getByLabel("E-mail").fill(email);
    await recovery.getByRole("button", { name: "Enviar link" }).click();
    await expect(recovery.getByRole("status")).toContainText(
      "Se a conta estiver disponível",
    );

    let messageId = "";
    await expect
      .poll(async () => {
        const url = new URL("/api/v1/search", mailpit);
        url.searchParams.set("query", `to:${email}`);
        const response = await request.get(url.href);
        const result = await response.json();
        messageId = result.messages?.[0]?.ID ?? "";
        return messageId;
      })
      .not.toBe("");
    const message = await request.get(
      new URL(`/api/v1/message/${messageId}`, mailpit).href,
    );
    const link = String((await message.json()).Text).match(
      /https?:\/\/\S+\/redefinir-senha\?token=[a-f0-9]{64}/,
    )?.[0];
    expect(link).toBeTruthy();

    await recovery.goto(link!);
    await recovery.getByLabel("Nova senha", { exact: true }).fill(password);
    await recovery.getByLabel("Confirme a senha").fill(password);
    await recovery.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(recovery.getByRole("status")).toContainText(
      "Senha atualizada",
    );
    expect((await page.request.get("/api/v1/session")).status()).toBe(401);

    await recovery.goto(link!);
    await recovery.getByLabel("Nova senha", { exact: true }).fill(password);
    await recovery.getByLabel("Confirme a senha").fill(password);
    await recovery.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(recovery.getByRole("main").getByRole("alert")).toContainText(
      "Link inválido ou expirado",
    );

    await recovery.goto("/entrar");
    await recovery.getByLabel("E-mail").fill(email);
    await recovery.getByLabel("Senha", { exact: true }).fill(password);
    await recovery.getByRole("button", { name: "Entrar" }).click();
    await expect(recovery).toHaveURL(/\/painel$/);
    expect(
      await db.auditLog.count({
        where: { organizationId, actorId: user.id, action: "PASSWORD_RESET" },
      }),
    ).toBe(1);
  } finally {
    await other.close();
    await db.$transaction([
      db.auditLog.deleteMany({ where: { organizationId, actorId: user.id } }),
      db.passwordResetToken.deleteMany({
        where: { organizationId, userId: user.id },
      }),
      db.user.delete({
        where: { organizationId_id: { organizationId, id: user.id } },
      }),
    ]);
    await db.$disconnect();
  }
});
