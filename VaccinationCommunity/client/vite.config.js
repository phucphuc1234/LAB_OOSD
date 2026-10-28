import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
    const apiEnv = loadEnv(mode, fileURLToPath(new URL("../server/", import.meta.url)), "");
    const apiPort = Number(process.env.PORT || apiEnv.PORT || 5000);
    return {
    plugins: [react(), tailwindcss()],
    server: {
        host: "127.0.0.1", port: 5173, strictPort: true,
        proxy: { "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } },
    },
    build: {
        sourcemap: false,
        chunkSizeWarningLimit: 1200,
    },
    };
});
