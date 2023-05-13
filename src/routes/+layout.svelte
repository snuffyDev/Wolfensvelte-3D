<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { E1M1 } from "$lib/utils/map";
	import { onMount, setContext } from "svelte";
	import { writable } from "svelte/store";
	import Level from "../lib/components/Level.svelte";
	import { textureData } from "../lib/utils/engine/textures";
	import MenuMusic from "../lib/music/menu.mp3?url";
	import { ctxKey, type WSContext } from "./key";
	import "./../app.scss";
	import { MusicManager } from "$lib/helpers/music";
	const textureStore = writable<Awaited<ReturnType<typeof textureData>>>({});
	const isLoadingNextMap = writable<boolean>(false);

	let loaded = false;

	onMount(async () => {
		MusicManager.loadAudioFile("menu", new URL(MenuMusic, import.meta.url).toString(), true, true);
		let textures: Awaited<ReturnType<typeof textureData>> = await textureData();
		textureStore.set(await textures);
		// if ($textureStore) {
		loaded = true;
		// }
	});

	// $: if ($textureStore)

	setContext(ctxKey, { textures: textureStore, isLoadingNextLevel: isLoadingNextMap } as WSContext);
	let hasAudioPerms = false;
	// console.log(E1M1);
</script>

<svelte:body
	on:pointerdown={() => {
		if (hasAudioPerms) return;
		hasAudioPerms = true;
	}}
/>
<!-- <Noise /> -->
{#if loaded}
	{#if !hasAudioPerms}
		<div
			class="center"
			style="text-align:center"
		>
			<div
				style="color: white; background-color: black;max-width:40vw; max-height:30vh; width:100%;height:100%;"
			>
				<h1>Please click anywhere to allow audio</h1>
				<h2 style="font-weight: 700;"><b>Controls</b></h2>

				<p>WASD to move <em>(or Up/Down Arrow Keys)</em></p>
				<p>Left/Right arrow keys to turn</p>
				<p>Space to use doors and shoot</p>
			</div>
		</div>
	{:else}
		<slot><!-- optional fallback --></slot>
	{/if}
{/if}

<style lang="scss">
	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.95em;
		position: absolute;
		height: 100%;
		width: 100%;
		justify-content: center;
		place-items: center;
		background-repeat: no-repeat;
		background-size: 100%;
	}
</style>
