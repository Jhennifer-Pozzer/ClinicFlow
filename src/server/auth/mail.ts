import nodemailer from "nodemailer";

export async function sendPasswordRecovery(email: string, token: string) {
  const {
    AUTH_URL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    MAIL_FROM,
  } = process.env;
  if (!AUTH_URL || !SMTP_HOST || !SMTP_PORT || !MAIL_FROM) {
    throw new Error("Configure a URL pública e o SMTP para recuperar senhas.");
  }

  const link = new URL("/redefinir-senha", AUTH_URL);
  if (
    link.protocol !== "https:" &&
    link.hostname !== "localhost" &&
    link.hostname !== "127.0.0.1"
  ) {
    throw new Error(
      "A recuperação de senha exige HTTPS fora do ambiente local.",
    );
  }
  link.searchParams.set("token", token);

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  await transport.sendMail({
    from: MAIL_FROM,
    to: email,
    subject: "Redefinição de senha | ClinicFlow",
    text: `Use este link em até 30 minutos para redefinir sua senha:\n${link.href}\n\nSe você não solicitou a redefinição, ignore esta mensagem.`,
  });
}
