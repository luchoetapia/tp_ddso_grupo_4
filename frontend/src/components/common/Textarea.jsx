import FormField, { controlClass } from "./FormField";

export default function Textarea({ label, error, className, rows = 3, ...props }) {
    return (
        <FormField label={label} error={error} className={className}>
            {(a11y) => <textarea rows={rows} className={controlClass} {...a11y} {...props} />}
        </FormField>
    );
}
