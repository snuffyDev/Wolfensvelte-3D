import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	assetsInclude: ["**/*.png"],
	build: {},
	experimental: {},
	esbuild: { drop: ["debugger", "console"] },
	plugins: [sveltekit()]
});
