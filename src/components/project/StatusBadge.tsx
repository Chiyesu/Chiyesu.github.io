import { statusLabels } from "@/content/projects";
import type { Maybe, ProjectStatus } from "@/content/types";

export function StatusBadge({ status }: { status: Maybe<ProjectStatus> }) {
  if (!status) return null;
  return (
    <span className="rounded-full border border-signal/50 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-signal">
      {statusLabels[status]}
    </span>
  );
}
