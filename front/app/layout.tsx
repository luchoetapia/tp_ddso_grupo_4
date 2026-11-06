import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TP DSI",
  description: "Organizaciones, colaboradoras y proyectos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <nav>
          <Link href="/">Inicio</Link>
          <Link href="/organizaciones/registrar">Registrar organización</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
