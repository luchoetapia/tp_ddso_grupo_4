import FormField, { controlClass } from "./FormField";

export default function Select({ label, error, className, children, ...props }) {
  return (
    <FormField label={label} error={error} className={className}>
      {(a11y) => (
        <select className={controlClass} {...a11y} {...props}>
          {children}
        </select>
      )}
    </FormField>
  );
}
