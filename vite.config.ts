import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import autoprefixer from "autoprefixer";

export default defineConfig({
	assetsInclude: ["**/*.png"],
	build: {},
	experimental: {},
	css: { postcss: { plugins: [autoprefixer()] } },
	esbuild: { drop: ["debugger", "console"] },
	plugins: [sveltekit()]
});
