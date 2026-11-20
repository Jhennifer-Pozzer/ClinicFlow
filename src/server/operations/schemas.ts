import { z } from "zod";
import { AppointmentStatus } from "@/generated/prisma/enums";

export const recordId = z.uuid();
export const daySchema = z.iso
  .date()
  .refine((day) => day >= "0001-01-01" && day < "9999-01-01");
const name = z
  .string()
  .trim()
  .min(2, "Informe um nome com pelo menos dois caracteres.")
  .max(120);
const email = z
  .union([z.literal(""), z.email().max(254)])
  .transform((value) => value.toLowerCase() || null);
const phone = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) =>
      value === "" ||
      (/^[+\d().\s-]+$/.test(value) && value.replace(/\D/g, "").length >= 8),
    "Informe um telefone válido.",
  )
  .transform((value) => value || null);
const contact = {
  email: z.string().trim().pipe(email).default(null),
  phone: phone.default(null),
};
const duration = z.coerce.number().int().min(5).max(720);
const slotTime = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
const endTime = z.union([slotTime, z.literal("24:00")]);

export const asMinute = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const availabilitySchema = z
  .array(
    z.object({
      weekday: z.coerce.number().int().min(0).max(6),
      start: slotTime,
      end: endTime,
    }),
  )
  .max(28)
  .superRefine((rows, ctx) => {
    const sorted = rows
      .slice()
      .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
    for (const [index, row] of sorted.entries()) {
      if (row.start >= row.end) {
        ctx.addIssue({
          code: "custom",
          message: "O início de cada horário deve ser anterior ao fim.",
        });
        return;
      }
      const previous = sorted[index - 1];
      if (previous?.weekday === row.weekday && previous.end > row.start) {
        ctx.addIssue({
          code: "custom",
          message: "Os horários de disponibilidade não podem se sobrepor.",
        });
        return;
      }
    }
  });

export const directorySchemas = {
  pacientes: z.object({
    name,
    birthDate: daySchema,
    ...contact,
    internalCode: z.string().trim().min(2).max(32).toUpperCase(),
    administrativeNote: z.string().trim().max(500).default(""),
    active: z.boolean().default(true),
  }),
  profissionais: z.object({
    name,
    ...contact,
    registration: z.string().trim().min(2).max(48).toUpperCase(),
    specialtyId: recordId,
    userId: z
      .union([z.literal(""), recordId])
      .default("")
      .transform((value) => value || null),
    defaultDurationMinutes: duration,
    active: z.boolean().default(true),
    availability: availabilitySchema.default([]),
  }),
  especialidades: z.object({ name, active: z.boolean().default(true) }),
  servicos: z.object({
    name,
    description: z.string().trim().min(2).max(500),
    specialtyId: recordId,
    durationMinutes: duration,
    price: z
      .string()
      .trim()
      .regex(
        /^\d{1,7}(?:[,.]\d{1,2})?$/,
        "Informe um valor em reais, como 150,00.",
      )
      .transform((value) => {
        const [reais, cents = ""] = value.split(/[,.]/);
        return Number(reais) * 100 + Number(cents.padEnd(2, "0"));
      }),
    active: z.boolean().default(true),
  }),
};

export const bookingSchema = z.object({
  patientId: recordId,
  professionalId: recordId,
  serviceId: recordId,
  day: daySchema,
  time: slotTime,
});

export const bookingCreateSchema = bookingSchema.extend({
  requestKey: recordId,
});
export const bookingUpdateSchema = bookingSchema.extend({
  revision: z.coerce.number().int().min(0).max(2147483646),
});
export const bookingStatusSchema = bookingUpdateSchema
  .pick({ revision: true })
  .extend({ status: z.enum(AppointmentStatus) });
export const bookingSlotsSchema = bookingSchema
  .pick({ day: true, professionalId: true, serviceId: true })
  .extend({ appointmentId: recordId.optional() });

export type BookingInput = z.infer<typeof bookingSchema>;
