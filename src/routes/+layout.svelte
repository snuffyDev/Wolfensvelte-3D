<script lang="ts">
	import { textureData } from '$lib/utils/map';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import '../app.scss';
	import { ctxKey, type TextureContext } from './key';

	const textureStore = writable<Awaited<ReturnType<typeof textureData>>>({});

	let loaded = false;
	onMount(async () => {
		let textures: Awaited<ReturnType<typeof textureData>> = await textureData();
		textureStore.set(textures);
		loaded = true;
	});

	// $: if ($textureStore)

	setContext(ctxKey, { textures: textureStore } as TextureContext);
</script>

{#if loaded}
	<slot><!-- optional fallback --></slot>
{/if}
