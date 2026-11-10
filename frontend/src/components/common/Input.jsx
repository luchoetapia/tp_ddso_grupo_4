import FormField, { controlClass } from "./FormField";

export default function Input({ label, error, className, type = "text", ...props }) {
  return (
    <FormField label={label} error={error} className={className}>
      {(a11y) => <input type={type} className={controlClass} {...a11y} {...props} />}
    </FormField>
  );
}
