const propsIcono = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
};

export const IconoCampana = () => (
    <svg {...propsIcono}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

export const IconoUsuario = () => (
    <svg {...propsIcono} width={18} height={18}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
);

export const IconoFlecha = () => (
    <svg {...propsIcono} width={16} height={16}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export const IconoSol = () => (
    <svg {...propsIcono}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
);

export const IconoLuna = () => (
    <svg {...propsIcono}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

export const IconoMonitor = () => (
    <svg {...propsIcono}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
    </svg>
);

export const IconoOrganizacion = () => (
    <svg {...propsIcono} width={18} height={18}>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
);

export const IconoEquipo = () => (
    <svg {...propsIcono} width={18} height={18}>
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0M16 3.13a4 4 0 0 1 0 7.75M22 21a7 7 0 0 0-4-6.3" />
    </svg>
);

export const IconoActividad = () => (
    <svg {...propsIcono} width={18} height={18}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
