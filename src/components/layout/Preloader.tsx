import { site } from "@/content/site";

/** Pure CSS and time-limited, so it can never trap the visitor behind a failed load. */
export function Preloader() {
  return (
    <div aria-hidden className="preloader pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-void">
      <div className="w-52">
        <p className="eyebrow text-center">{site.name}</p>
        <div className="mt-4 h-px bg-line">
          <div className="preloader-bar h-px bg-signal" />
        </div>
      </div>
    </div>
  );
}
