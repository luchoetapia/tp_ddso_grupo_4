import { Button, Input, Select } from "@/components/common";

// Mismos valores que MedioDeContacto en la API
export const MEDIOS_CONTACTO = [
    { valor: "Email", texto: "Email", tipo: "email", ejemplo: "nombre@mail.com" },
    { valor: "WhatsApp", texto: "WhatsApp", tipo: "tel", ejemplo: "+54 9 11 1234-5678" },
    { valor: "SMS", texto: "SMS", tipo: "tel", ejemplo: "+54 9 11 1234-5678" },
];

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\+?[\d\s()-]{6,20}$/;

const datosMedio = (medio) => MEDIOS_CONTACTO.find((m) => m.valor === medio) ?? MEDIOS_CONTACTO[0];

// Error de un contacto, o undefined si está bien
export const errorDeContacto = ({ medio, valor }) => {
    const texto = valor.trim();
    if (!texto) return "Completá el dato de contacto o quitalo.";
    if (medio === "Email" && !REGEX_EMAIL.test(texto)) return "Ingresá un email válido.";
    if (medio !== "Email" && !REGEX_TELEFONO.test(texto)) return "Ingresá un número de teléfono válido.";
    return undefined;
};

// Lista editable de medios de contacto: { medio, valor }[]
// mostrarErrores: se activan al intentar guardar, para no marcar en rojo mientras se escribe
export default function EditorContactos({ contactos, onChange, mostrarErrores = false }) {
    const actualizar = (indice, campo, valor) =>
        onChange(contactos.map((contacto, i) => (i === indice ? { ...contacto, [campo]: valor } : contacto)));

    const quitar = (indice) => onChange(contactos.filter((_, i) => i !== indice));

    const agregar = () => onChange([...contactos, { medio: "Email", valor: "" }]);

    return (
        <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
            <legend className="mb-1 p-0">
                <span className="block text-lg font-bold text-text">Medios de contacto</span>
                <span className="block text-[13px] text-muted">
                    No se muestran públicamente: solo los ven las organizaciones que aceptaron tu postulación. También
                    los usamos para reenviarte los mensajes de la plataforma.
                </span>
            </legend>

            {contactos.length === 0 && <p className="m-0 text-[13px] text-muted">Todavía no cargaste medios de contacto.</p>}

            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {contactos.map((contacto, indice) => {
                    const medio = datosMedio(contacto.medio);
                    return (
                        <li key={indice} className="grid items-start gap-2 sm:grid-cols-[160px_1fr_auto]">
                            <Select
                                label={`Medio ${indice + 1}`}
                                value={contacto.medio}
                                onChange={(e) => actualizar(indice, "medio", e.target.value)}
                            >
                                {MEDIOS_CONTACTO.map(({ valor, texto }) => (
                                    <option key={valor} value={valor}>
                                        {texto}
                                    </option>
                                ))}
                            </Select>
                            <Input
                                label={medio.valor === "Email" ? "Email" : "Número"}
                                type={medio.tipo}
                                value={contacto.valor}
                                placeholder={medio.ejemplo}
                                onChange={(e) => actualizar(indice, "valor", e.target.value)}
                                error={mostrarErrores ? errorDeContacto(contacto) : undefined}
                            />
                            <Button
                                variant="danger"
                                onClick={() => quitar(indice)}
                                aria-label={`Quitar medio de contacto ${indice + 1}`}
                                className="sm:mt-[21px]"
                            >
                                Quitar
                            </Button>
                        </li>
                    );
                })}
            </ul>

            <Button onClick={agregar} className="self-start">
                + Agregar medio de contacto
            </Button>
        </fieldset>
    );
}
