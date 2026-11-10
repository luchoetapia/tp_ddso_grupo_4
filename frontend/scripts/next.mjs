// Lanza `next dev` / `next start` usando el puerto definido en .env (PORT).
// Next decide el puerto antes de leer los .env, por eso se carga acá primero.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

try {
  process.loadEnvFile(".env");
} catch {
  // sin .env: se usa el valor por defecto
}

const comando = process.argv[2]; // "dev" | "start"
const puerto = process.env.PORT || "3001";
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

spawn(process.execPath, [nextBin, comando, "-p", puerto], {
  stdio: "inherit",
}).on("exit", (codigo) => process.exit(codigo ?? 0));
