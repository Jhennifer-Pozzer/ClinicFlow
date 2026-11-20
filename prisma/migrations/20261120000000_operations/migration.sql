BEGIN;

CREATE TYPE "AppointmentEvent" AS ENUM ('CREATED', 'UPDATED', 'RESCHEDULED', 'STATUS_CHANGED');

ALTER TABLE "Appointment"
    ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "requestKey" UUID,
    ADD COLUMN "requestFingerprint" CHAR(64),
    ADD CONSTRAINT appointment_request_complete CHECK (("requestKey" IS NULL) = ("requestFingerprint" IS NULL));

CREATE UNIQUE INDEX "Appointment_organizationId_requestKey_key"
    ON "Appointment"("organizationId", "requestKey");

ALTER TABLE "AppointmentStatusHistory"
    ADD COLUMN "event" "AppointmentEvent" NOT NULL DEFAULT 'STATUS_CHANGED',
    ADD COLUMN "previousStartsAt" TIMESTAMPTZ,
    ADD COLUMN "startsAt" TIMESTAMPTZ;

UPDATE "AppointmentStatusHistory" SET "event" = 'CREATED' WHERE "fromStatus" IS NULL;

COMMIT;

