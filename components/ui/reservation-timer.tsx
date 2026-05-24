"use client";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const URGENT_THRESHOLD_MS = 2 * 60 * 1000;

type ReservationTimerProps = {
  timeLeftMs: number;
};

function formatMMSS(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ReservationTimer({ timeLeftMs }: ReservationTimerProps) {
  const progress = Math.max(0, Math.min(1, timeLeftMs / TEN_MINUTES_MS));
  const urgent = timeLeftMs > 0 && timeLeftMs <= URGENT_THRESHOLD_MS;
  const expired = timeLeftMs <= 0;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl border px-6 py-6 ${
        expired
          ? "border-red-200 bg-red-50"
          : urgent
            ? "border-amber-300 bg-amber-50/80"
            : "border-slate-200 bg-gradient-to-b from-slate-50 to-white"
      }`}
    >
      <p
        className={`mb-4 text-xs font-medium uppercase tracking-widest ${
          expired ? "text-red-600" : urgent ? "text-amber-700" : "text-slate-500"
        }`}
      >
        {expired ? "Time expired" : "Confirm before time runs out"}
      </p>

      <div className="relative">
        {urgent && !expired && (
          <span
            className="absolute inset-0 rounded-full bg-amber-400/20 timer-pulse-ring"
            aria-hidden="true"
          />
        )}

        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-200"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${
              expired ? "text-red-500" : urgent ? "text-amber-500" : "text-emerald-500"
            }`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-3xl font-semibold tabular-nums tracking-tight ${
              expired
                ? "text-red-600 countdown-flash"
                : urgent
                  ? "text-amber-700 countdown-flash"
                  : "text-slate-900"
            }`}
          >
            {formatMMSS(timeLeftMs)}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            min : sec
          </span>
        </div>
      </div>

      {!expired && (
        <p className={`mt-4 text-center text-sm ${urgent ? "text-amber-800" : "text-slate-600"}`}>
          {urgent
            ? "Hurry — your hold is about to expire."
            : "Stock is held for you until the timer reaches zero."}
        </p>
      )}
    </div>
  );
}
