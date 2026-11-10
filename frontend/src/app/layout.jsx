import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Código a Voluntad",
  description:
    "Plataforma que conecta colectivos con colaboradoras para proyectos de software libre.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
