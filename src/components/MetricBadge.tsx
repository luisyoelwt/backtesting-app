import clsx from "clsx";

interface MetricBadgeProps {
  value: number | null;
  suffix?: string;
  positive?: "high" | "low"; // 'high' = green when positive, 'low' = green when low
}

export function MetricBadge({ value, suffix = "%", positive = "high" }: MetricBadgeProps) {
  if (value === null || value === undefined) {
    return <span className="text-white/20 text-sm font-mono">—</span>;
  }

  const isGood = positive === "high" ? value >= 0 : value <= 0;

  return (
    <span
      className={clsx(
        "text-sm font-mono font-medium",
        isGood ? "text-emerald-400" : "text-red-400"
      )}
    >
      {value > 0 && positive === "high" ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}
