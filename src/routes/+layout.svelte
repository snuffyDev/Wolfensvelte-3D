<script
	context="module"
	lang="ts"
>
	const levelMusic = import.meta.glob("$lib/music/*", { as: "url" });
</script>

<script lang="ts">
	import { onMount, setContext } from "svelte";
	import { writable } from "svelte/store";
	import { textureData } from "../lib/utils/engine/textures";
	import MenuMusic from "../lib/music/menu.mp3?url";
	import E1M1Music from "../lib/music/E1M1.mp3?url";
	import Wondering from "../lib/music/Wondering_About_My_Loved_Ones.ogg?url";
	import E1M2Music from "../lib/music/E1M2.ogg?url";
	import { ctxKey, type WSContext } from "./key";
	import "./../app.scss";
	import { AudioEngine } from "$lib/helpers/music";
	import { page } from "$app/stores";
	import { gameData } from "$lib/helpers/maps";
	const textureStore = writable<Awaited<ReturnType<typeof textureData>>>({});
	const isLoadingNextMap = writable<boolean>(false);

	let loaded = false;

	onMount(async () => {
		let textures: Awaited<ReturnType<typeof textureData>> = await textureData();
		textureStore.set(await textures);

		AudioEngine.loadAudioFile("wondering", Wondering, false, true);
		AudioEngine.loadAudioFile("menu", MenuMusic, true, true);
		console.time("start - og");
		await gameData.loadResources();
		gameData.loadLevel(1);
		console.log(gameData.get());
		console.timeEnd("start - og");
		loaded = true;
		// }
	});

	// $: if ($textureStore)

	setContext(ctxKey, { textures: textureStore, isLoadingNextLevel: isLoadingNextMap } as WSContext);
	let hasAudioPerms = false;
	$: console.log($page);
</script>

<svelte:window
	on:keydown={() => {
		if (hasAudioPerms) return;
		hasAudioPerms = true;
		if ($page.route.id !== "/[...level]") {
			AudioEngine.play("menu", true);
		}
	}}
	on:click={() => {
		if (hasAudioPerms) return;
		hasAudioPerms = true;
		if ($page.route.id !== "/[...level]") {
			AudioEngine.play("menu", true);
		}
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
