import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">© {site.name}</p>
        <p className="eyebrow text-dim">{site.role}</p>
      </div>
    </footer>
  );
}
