export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`h-[60px] animate-pulse rounded-lg bg-sf ${className ?? ""}`}
    />
  );
}
