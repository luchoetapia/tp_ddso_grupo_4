'use client'

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button, Card, Select, Skeleton, Tag, Toast } from "@/components/common";

const mensajeDeError = (e, porDefecto) => e?.response?.data?.message ?? porDefecto;

const BuscarColaboradoras = () => {
    const [proyectos, setProyectos] = useState([]);
    const [idProyecto, setIdProyecto] = useState("");
    const [idPerfil, setIdPerfil] = useState("");
    const [colaboradoras, setColaboradoras] = useState(null); 
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [aContactar, setAContactar] = useState(null);
    const ultimaBusqueda = useRef(0);

    useEffect(() => {
        axios
            .get("/api/proyectos")
            .then(({ data }) => setProyectos(data.filter((p) => !p.finalizado)))
            .catch((e) => setError(mensajeDeError(e, "No se pudieron cargar los proyectos.")));
    }, []);

    const proyecto = proyectos.find((p) => p.id === idProyecto);

    const cambiarProyecto = (id) => {
        ultimaBusqueda.current++;
        setIdProyecto(id);
        setIdPerfil("");
        setColaboradoras(null);
        setCargando(false);
        setError(null);
        setAviso(null);
    };
    
    const cambiarPerfil = async (id) => {
        setIdPerfil(id);
        setAviso(null);
        setError(null);
        if (!id) {
            ultimaBusqueda.current++;
            setColaboradoras(null);
            return;
        }

    const numero = ++ultimaBusqueda.current;
    const sigueVigente = () => numero === ultimaBusqueda.current;
    setCargando(true);
    try {
            const { data } = await axios.get(
                `/api/proyectos/${idProyecto}/perfiles/${id}/buscarPotencialesColaboradores`
            );
            if (sigueVigente()) setColaboradoras(data);
        } catch (e) {
            if (sigueVigente()) setError(mensajeDeError(e, "No se pudo realizar la búsqueda."));
        } finally {
            if (sigueVigente()) setCargando(false);
        }
    };
      
     const alEnviar = (texto) => {
        setAContactar(null);
        setAviso(texto);
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

        {error && (
                <p role="alert" className="text-error">
                    {error}
                </p>
            )}

            <div aria-live="polite">{aviso && <Toast>{aviso}</Toast>}</div>
        
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
