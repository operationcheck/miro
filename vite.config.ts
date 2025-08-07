import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Miro",
  version: "1.0.0",
  description: "An auto-play tool for report videos with the latest features",
  author: { email: "operationcheck@proton.me" },
  permissions: ["contextMenus", "storage", "notifications"],
  icons: {
    "16": "src/assets/icon16.png",
    "19": "src/assets/icon19.png",
    "38": "src/assets/icon38.png",
    "128": "src/assets/icon128.png",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://www.nnn.ed.nico/*"],
      run_at: "document_idle",
      js: ["src/content.tsx"],
    },
  ],
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    minify: "terser",
    rollupOptions: {
      input: {
        content: "src/content.tsx",
        background: "src/background.ts",
      },
    },
  },
  optimizeDeps: {
    include: ["lucide-react"],
    exclude: ["lucide-react/icons"],
  },
});