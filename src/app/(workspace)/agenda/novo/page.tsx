import Link from "next/link";
import { randomUUID } from "node:crypto";
import { BookingEditor } from "@/components/operations/booking-form";
import {
  OperationsHeading,
  OperationsWorkspace,
  workspaceActor,
} from "@/components/operations/workspace";
import { buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { localDay } from "@/lib/calendar";
import { bookingOptions } from "@/server/operations/calendar";
import { daySchema } from "@/server/operations/schemas";

export const metadata = { title: "Novo agendamento" };

export default async function NewAppointmentPage({
  searchParams,
}: PageProps<"/agenda/novo">) {
  const actor = await workspaceActor("schedules:manage");
  const { data, profissional } = await searchParams;
  const options = await bookingOptions(actor);
  const timezone = actor.organization.timezone;
  const today = localDay(new Date(), timezone);
  const selected = daySchema.safeParse(data).data;
  const day = selected && selected >= today ? selected : today;
  const preferred =
    options.professionals.find(({ id }) => id === profissional)?.id ?? "";

  return (
    <OperationsWorkspace actor={actor} active="agenda">
      <OperationsHeading
        title="Novo agendamento"
        description="Escolha o paciente, o serviço e um horário disponível."
      >
        <Link href="/agenda" className={buttonStyles({ variant: "outline" })}>
          Voltar para agenda
        </Link>
      </OperationsHeading>
      <Panel className="max-w-3xl">
        <BookingEditor
          options={options}
          initial={{
            patientId: "",
            professionalId: preferred,
            serviceId: "",
            day,
            time: "",
          }}
          requestKey={randomUUID()}
          timezone={timezone}
        />
      </Panel>
    </OperationsWorkspace>
  );
}
