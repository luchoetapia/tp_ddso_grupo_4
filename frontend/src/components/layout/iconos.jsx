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
