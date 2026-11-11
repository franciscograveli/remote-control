import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Configuração do servidor de desenvolvimento (Vite)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // expõe na rede local, para abrir em outros aparelhos
    port: 8443,
  },
});
