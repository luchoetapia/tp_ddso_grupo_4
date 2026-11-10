"use client";

import { useEffect, useId, useRef } from "react";

// Modal accesible sobre <dialog>: foco atrapado, Esc cierra y click en el fondo cierra.
export default function Modal({ open, onClose, title, children, footer }) {
  const ref = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose?.()}
      aria-labelledby={tituloId}
      className="m-auto w-full max-w-[420px] rounded-[14px] border border-border bg-card p-0 text-text backdrop:bg-black/55"
    >
      <div className="flex flex-col gap-2 p-[18px]">
        <h3 id={tituloId} className="text-[17px] font-bold">
          {title}
        </h3>
        {children}
        {footer && <div className="mt-2 flex flex-wrap items-center gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
