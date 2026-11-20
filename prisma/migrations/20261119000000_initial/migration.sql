BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH', 'CARD', 'TRANSFER');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "openingHours" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "internalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "administrativeNote" TEXT,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "specialtyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAvailability" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProfessionalAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "specialtyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ NOT NULL,
    "endsAt" TIMESTAMPTZ NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusHistory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "actorId" UUID,
    "fromStatus" "AppointmentStatus",
    "toStatus" "AppointmentStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "appointmentId" UUID,
    "description" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "settledAt" TIMESTAMPTZ,
    "paymentMethod" "PaymentMethod",
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "sessionVersion" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" CHAR(64) NOT NULL,
    "hits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_id_key" ON "User"("organizationId", "id");

-- CreateIndex
CREATE INDEX "Patient_organizationId_archivedAt_name_idx" ON "Patient"("organizationId", "archivedAt", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_organizationId_id_key" ON "Patient"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_organizationId_internalCode_key" ON "Patient"("organizationId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_organizationId_id_key" ON "Specialty"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_organizationId_name_key" ON "Specialty"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Professional_organizationId_specialtyId_idx" ON "Professional"("organizationId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_organizationId_id_key" ON "Professional"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_organizationId_userId_key" ON "Professional"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_organizationId_registration_key" ON "Professional"("organizationId", "registration");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAvailability_organizationId_professionalId_week_key" ON "ProfessionalAvailability"("organizationId", "professionalId", "weekday", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "Service_organizationId_id_key" ON "Service"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_organizationId_specialtyId_name_key" ON "Service"("organizationId", "specialtyId", "name");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_startsAt_status_idx" ON "Appointment"("organizationId", "startsAt", "status");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_professionalId_startsAt_idx" ON "Appointment"("organizationId", "professionalId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_patientId_startsAt_idx" ON "Appointment"("organizationId", "patientId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_serviceId_startsAt_idx" ON "Appointment"("organizationId", "serviceId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_organizationId_id_key" ON "Appointment"("organizationId", "id");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_organizationId_appointmentId_creat_idx" ON "AppointmentStatusHistory"("organizationId", "appointmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCategory_organizationId_id_type_key" ON "FinancialCategory"("organizationId", "id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialCategory_organizationId_type_name_key" ON "FinancialCategory"("organizationId", "type", "name");

-- CreateIndex
CREATE INDEX "FinancialTransaction_organizationId_status_dueDate_idx" ON "FinancialTransaction"("organizationId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "FinancialTransaction_organizationId_settledAt_idx" ON "FinancialTransaction"("organizationId", "settledAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_organizationId_appointmentId_idx" ON "FinancialTransaction"("organizationId", "appointmentId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_organizationId_userId_key" ON "PasswordResetToken"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_organizationId_userId_fkey" FOREIGN KEY ("organizationId", "userId") REFERENCES "User"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_organizationId_specialtyId_fkey" FOREIGN KEY ("organizationId", "specialtyId") REFERENCES "Specialty"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailability" ADD CONSTRAINT "ProfessionalAvailability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailability" ADD CONSTRAINT "ProfessionalAvailability_organizationId_professionalId_fkey" FOREIGN KEY ("organizationId", "professionalId") REFERENCES "Professional"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_specialtyId_fkey" FOREIGN KEY ("organizationId", "specialtyId") REFERENCES "Specialty"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_patientId_fkey" FOREIGN KEY ("organizationId", "patientId") REFERENCES "Patient"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_professionalId_fkey" FOREIGN KEY ("organizationId", "professionalId") REFERENCES "Professional"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_serviceId_fkey" FOREIGN KEY ("organizationId", "serviceId") REFERENCES "Service"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_organizationId_appointmentId_fkey" FOREIGN KEY ("organizationId", "appointmentId") REFERENCES "Appointment"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_organizationId_actorId_fkey" FOREIGN KEY ("organizationId", "actorId") REFERENCES "User"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCategory" ADD CONSTRAINT "FinancialCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_organizationId_categoryId_type_fkey" FOREIGN KEY ("organizationId", "categoryId", "type") REFERENCES "FinancialCategory"("organizationId", "id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_organizationId_appointmentId_fkey" FOREIGN KEY ("organizationId", "appointmentId") REFERENCES "Appointment"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_actorId_fkey" FOREIGN KEY ("organizationId", "actorId") REFERENCES "User"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_organizationId_userId_fkey" FOREIGN KEY ("organizationId", "userId") REFERENCES "User"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restrições PostgreSQL adicionais que não são representadas no schema Prisma.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "User"
    ADD CONSTRAINT user_email_canonical CHECK ("email" = lower(btrim("email")));

ALTER TABLE "Professional"
    ADD CONSTRAINT professional_positive_duration CHECK ("defaultDurationMinutes" BETWEEN 1 AND 1440);

ALTER TABLE "ProfessionalAvailability"
    ADD CONSTRAINT availability_valid_window CHECK (
        "weekday" BETWEEN 0 AND 6 AND
        "startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute"
    ),
    ADD CONSTRAINT availability_professional_no_overlap EXCLUDE USING gist (
        "organizationId" WITH =,
        "professionalId" WITH =,
        "weekday" WITH =,
        int4range("startMinute", "endMinute", '[)') WITH &&
    );

ALTER TABLE "Service"
    ADD CONSTRAINT service_positive_duration CHECK ("durationMinutes" BETWEEN 1 AND 1440),
    ADD CONSTRAINT service_nonnegative_price CHECK ("priceCents" >= 0);

ALTER TABLE "Appointment"
    ADD CONSTRAINT appointment_valid_window CHECK ("startsAt" < "endsAt"),
    ADD CONSTRAINT appointment_nonnegative_price CHECK ("priceCents" >= 0),
    ADD CONSTRAINT appointment_professional_no_overlap EXCLUDE USING gist (
        "organizationId" WITH =,
        "professionalId" WITH =,
        tstzrange("startsAt", "endsAt", '[)') WITH &&
    ) WHERE ("status" <> 'CANCELLED');

ALTER TABLE "FinancialTransaction"
    ADD CONSTRAINT transaction_nonnegative_amount CHECK ("amountCents" >= 0),
    ADD CONSTRAINT transaction_settlement_consistent CHECK (
        ("status" = 'SETTLED' AND "settledAt" IS NOT NULL AND "paymentMethod" IS NOT NULL)
        OR ("status" <> 'SETTLED' AND "settledAt" IS NULL AND "paymentMethod" IS NULL)
    );

COMMIT;
