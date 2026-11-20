import { describe, expect, it } from "vitest";
import { can } from "../../src/server/auth/permissions";
import { hashPassword, verifyPassword } from "../../src/server/auth/password";
import { loginSchema, resetSchema } from "../../src/server/auth/schemas";

describe("autenticação", () => {
  it("normaliza o e-mail e preserva a senha digitada", () => {
    expect(
      loginSchema.parse({
        email: " Admin@ClinicFlow.example ",
        password: " palavra ",
      }),
    ).toEqual({ email: "admin@clinicflow.example", password: " palavra " });
  });

  it("rejeita tokens inválidos e senhas divergentes", () => {
    const input = {
      token: "0".repeat(64),
      password: "uma senha bem longa",
      confirmation: "uma senha bem longa",
    };
    expect(resetSchema.safeParse(input).success).toBe(true);
    expect(resetSchema.safeParse({ ...input, token: "inválido" }).success).toBe(
      false,
    );
    expect(
      resetSchema.safeParse({ ...input, confirmation: "senha divergente" })
        .success,
    ).toBe(false);
  });

  it("usa salt individual e verifica apenas a senha correta", async () => {
    const password = "senha de teste individual";
    const first = await hashPassword(password);
    expect(await hashPassword(password)).not.toBe(first);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("outra senha", first)).toBe(false);
    expect(await verifyPassword(password)).toBe(false);
  });

  it("limita a recepção e o profissional às permissões de seus perfis", () => {
    expect(can("ADMIN", "finance:manage")).toBe(true);
    expect(can("RECEPTIONIST", "patients:manage")).toBe(true);
    expect(can("RECEPTIONIST", "finance:manage")).toBe(false);
    expect(can("PROFESSIONAL", "own-schedule:read")).toBe(true);
    expect(can("PROFESSIONAL", "schedules:manage")).toBe(false);
    expect(can("PROFESSIONAL", "patients:manage")).toBe(false);
  });
});
