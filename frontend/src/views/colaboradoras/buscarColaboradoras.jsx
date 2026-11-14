'use client'

import { useEffect, useRef, useState } from "react";
import { Button, Card, Select, Skeleton, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";

const BuscarColaboradoras = () => {
    const [proyectos, setProyectos] = useState([]);
    const [idProyecto, setIdProyecto] = useState("");
    const [idPerfil, setIdPerfil] = useState("");
    const [colaboradoras, setColaboradoras] = useState(null); 
    const [cargando, setCargando] = useState(false);
    const [aContactar, setAContactar] = useState(null);
    const ultimaBusqueda = useRef(0);

    useEffect(() => {
        // Los errores los muestra apiQuery como alerta
        apiQuery
            .get("/proyectos", { mensajeError: "No se pudieron cargar los proyectos." })
            .then((data) => setProyectos(data.filter((p) => !p.finalizado)))
            .catch(() => {});
    }, []);

    const proyecto = proyectos.find((p) => p.id === idProyecto);

    const cambiarProyecto = (id) => {
        ultimaBusqueda.current++;
        setIdProyecto(id);
        setIdPerfil("");
        setColaboradoras(null);
        setCargando(false);
    };
    
    const cambiarPerfil = async (id) => {
        setIdPerfil(id);
        if (!id) {
            ultimaBusqueda.current++;
            setColaboradoras(null);
            return;
        }

    const numero = ++ultimaBusqueda.current;
    const sigueVigente = () => numero === ultimaBusqueda.current;
    setCargando(true);
    try {
            const data = await apiQuery.get(
                `/proyectos/${idProyecto}/perfiles/${id}/buscarPotencialesColaboradores`,
                { mensajeError: "No se pudo realizar la búsqueda." }
            );
            if (sigueVigente()) setColaboradoras(data);
        } catch {
            // apiQuery ya mostró la alerta de error
        } finally {
            if (sigueVigente()) setCargando(false);
        }
    };
      
     const alEnviar = (texto) => {
        setAContactar(null);
        alertas.exito(texto);
    };

return (
    <section className="flex flex-col gap-4">
         <h1>Buscar colaboradoras</h1>

         <div className="flex flex-wrap gap-3">
                <Select label="Proyecto" value={idProyecto} onChange={(e) => cambiarProyecto(e.target.value)}>
                    <option value="">Elegí un proyecto</option>
                    {proyectos.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.titulo}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Perfil"
                    value={idPerfil}
                    onChange={(e) => cambiarPerfil(e.target.value)}
                    disabled={!proyecto}
                >
                    <option value="">Elegí un perfil</option>
                    {proyecto?.perfiles.map((perfil) => (
                        <option key={perfil.id} value={perfil.id}>
                            {perfil.titulo}
                        </option>
                    ))}
                </Select>
            </div>

        
        <div aria-busy={cargando}>
                {cargando && (
                    <div className="flex flex-col gap-3">
                        <Skeleton />
                        <Skeleton />
                        <Skeleton />
                    </div>
                )}

        {!cargando && colaboradoras?.length === 0 && (
                    <p className="text-muted">Todavía no hay colaboradoras que encajen con este perfil.</p>
                )}
        
         {!cargando && colaboradoras?.length > 0 && (
                    <ul className="flex flex-col gap-3">
                        {colaboradoras.map((c) => (
                            <Card as="li" key={c.id}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="font-sans text-base">{c.nombreFantasia || c.cuentaGit}</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {c.habilidades.map((h) => (
                                            <Tag key={h.id}>{h.titulo}</Tag>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Button
                                        variant="primary"
                                        onClick={() => setAContactar(c)}
                                        disabled={!c.deseaSerContactado}
                                    >
                                        Contactar
                                    </Button>
                                    {!c.deseaSerContactado && (
                                        <span className="ml-3 text-[13px] text-muted">
                                            No acepta mensajes internos
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </div>

            {/* TODO lo de contactar */}

</section>
);
}

export default BuscarColaboradoras;
