export default function Checkbox({ label, className, ...props }) {
  return (
    <label className={`inline-flex items-center gap-1.5 text-[13px] text-muted ${className ?? ""}`}>
      <input type="checkbox" className="accent-accent" {...props} />
      {label}
    </label>
  );
}
