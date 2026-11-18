import { FaGithub } from 'react-icons/fa'
import { Button, Card, Tag } from '@/components/common'
import alertas from '@/services/alertas'

// Nombre visible: el de fantasía si lo eligió, si no nombre y apellido, si no su cuenta de GitHub
export const nombreVisible = ({ nombreFantasia, nombre, apellido, cuentaGit }) =>
    nombreFantasia || [nombre, apellido].filter(Boolean).join(' ') || cuentaGit;

const iniciales = (texto) => texto.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)
    .map((palabra) => palabra[0]).join('').slice(0, 2).toUpperCase() || '?';

const copiarCuentaGit = async (cuentaGit) => {
    try {
        await navigator.clipboard.writeText(cuentaGit);
        alertas.exito(`Copiaste el usuario de GitHub "${cuentaGit}".`);
    } catch {
        alertas.error('No se pudo copiar el usuario de GitHub.');
    }
};

// Card de un colaborador compatible con los perfiles abiertos del colectivo (Buscar colaboradores)
const TarjetaColaborador = ({ colaborador, onEnviarMensaje }) => {
    const nombre = nombreVisible(colaborador);
    const [primerPerfil, ...otrosPerfiles] = colaborador.perfilesCompatibles ?? [];

    return (
        <Card as="article" className="h-full gap-3">
            <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                    {iniciales(nombre)}
                </span>
                <div className="flex min-w-0 flex-col">
                    <h2 className="m-0 truncate font-sans text-[17px] font-bold">
                        {nombre}
                        {colaborador.pronombres && (
                            <span className="ml-1 text-[13px] font-normal text-muted">({colaborador.pronombres})</span>
                        )}
                    </h2>
                    <button
                        type="button"
                        onClick={() => copiarCuentaGit(colaborador.cuentaGit)}
                        title="Copiar usuario de GitHub"
                        className="mt-0.5 inline-flex w-fit max-w-full cursor-pointer items-center gap-1 rounded-xl border-0 bg-highlight px-2 py-0.5 text-xs font-semibold text-[#16302b]"
                    >
                        <FaGithub aria-hidden="true" size={12} className="shrink-0" />
                        <span className="truncate">{colaborador.cuentaGit}</span>
                        <span className="sr-only">(copiar usuario de GitHub)</span>
                    </button>
                </div>
            </div>

            {colaborador.habilidades.length > 0 && (
                <ul aria-label="Habilidades" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {colaborador.habilidades.map((h) => (
                        <li key={h.id}><Tag>{h.titulo}</Tag></li>
                    ))}
                </ul>
            )}

            {primerPerfil && (
                <div className="flex flex-col gap-0.5 rounded-[10px] bg-sf px-2.5 py-2 text-[13px]">
                    <span className="text-[11px] font-bold tracking-[.1em] text-muted uppercase">Encaja en</span>
                    <span><b>{primerPerfil.perfil.titulo}</b> · {primerPerfil.proyecto.titulo}</span>
                    {otrosPerfiles.length > 0 && (
                        <span className="text-muted">
                            +{otrosPerfiles.length} {otrosPerfiles.length === 1 ? 'perfil más' : 'perfiles más'}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-auto flex flex-col gap-1.5">
                <Button
                    variant="primary"
                    className="w-full"
                    disabled={!colaborador.deseaSerContactado || !primerPerfil}
                    onClick={() => onEnviarMensaje(colaborador)}
                >
                    Enviar mensaje
                    <span className="sr-only"> a {nombre}</span>
                </Button>
                {!colaborador.deseaSerContactado && (
                    <span className="text-center text-[13px] text-muted">No acepta mensajes</span>
                )}
            </div>
        </Card>
    );
};

export default TarjetaColaborador
