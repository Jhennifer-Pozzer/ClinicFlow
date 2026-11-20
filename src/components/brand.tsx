import { Activity } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-white">
        <Activity aria-hidden="true" size={21} />
      </span>
      ClinicFlow
    </div>
  );
}
