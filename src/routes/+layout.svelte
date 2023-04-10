<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { E1M1 } from "$lib/utils/map";
	import { onMount, setContext } from "svelte";
	import { writable } from "svelte/store";
	import Level from "../lib/components/Level.svelte";
	import { textureData } from "../lib/utils/engine/textures";
	import { ctxKey, type TextureContext } from "./key";
	import "./../app.scss";
	const textureStore = writable<Awaited<ReturnType<typeof textureData>>>({});

	let loaded = false;

	onMount(async () => {
		let textures: Awaited<ReturnType<typeof textureData>> = await textureData();
		textureStore.set(await textures);
		// if ($textureStore) {
		loaded = true;
		// }
	});

	// $: if ($textureStore)

	setContext(ctxKey, { textures: textureStore } as TextureContext);
	let play = false;
	// console.log(E1M1);
</script>

<!-- <Noise /> -->
{#if loaded}
	<slot><!-- optional fallback --></slot>
{/if}

<style lang="scss">
</style>
