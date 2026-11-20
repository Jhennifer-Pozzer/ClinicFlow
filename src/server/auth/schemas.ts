import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const newPassword = z.string().min(12).max(128);
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});
export const recoverySchema = z.object({ email });
export const resetToken = z.string().regex(/^[a-f0-9]{64}$/);
export const resetSchema = z
  .object({
    token: resetToken,
    password: newPassword,
    confirmation: newPassword,
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    path: ["confirmation"],
    message: "As senhas precisam ser iguais.",
  });
