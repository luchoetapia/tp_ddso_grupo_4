export default function ProgressBar({ value, label = "Completado" }) {
  const porcentaje = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className="h-3 flex-1 rounded-md border border-border bg-sf"
      >
        <div
          className="h-full rounded-md bg-accent"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <b>{porcentaje}%</b>
    </div>
  );
}
