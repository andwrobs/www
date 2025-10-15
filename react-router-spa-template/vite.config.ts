import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => ({
	plugins: [
		// Tailwind plugin
		tailwindcss(),

		// Enable path aliasing
		tsconfigPaths(),

		// Vitest uses @vitejs/plugin-react, React Router uses @react-router/dev/vite
		process.env.VITEST ? react() : reactRouter(),

		// "npm run build:analyze" includes Vite bundle visualizer plugin and outputs to build/stats.html
		command === "build" &&
			mode === "analyze" &&
			visualizer({
				template: "treemap",
				gzipSize: true,
				emitFile: true,
			}),
	].filter(Boolean),

	server: {
		host: true,
		port: 3000, // "npm run dev" will serve the app on this port
	},

	preview: {
		host: true,
		port: 4000, // "npm run build && npm run preview" will serve the production build preview on this port
	},

	build: {
		chunkSizeWarningLimit: 3500, // in KB, current default = 3.5 MB
	},

	test: {
		reporters: ["default"],
		globals: true,
		setupFiles: ["./vitest-setup.mts", "./test-utils/screen-size-mock.ts"],
		environment: "jsdom",
		coverage: {
			thresholds: {
				statements: 80,
				functions: 80,
				branches: 50,
				lines: 80,
			},
		},
	},
}));
