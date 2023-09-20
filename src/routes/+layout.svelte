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
	import { ctxKey, type WSContext } from "./key";
	import "./../app.scss";
	import { AudioEngine } from "$lib/helpers/music";
	import { page } from "$app/stores";
	import { gameData } from "$lib/helpers/maps";
	import { Soundtrack } from "$lib/music";
	const textureStore = writable<Awaited<ReturnType<typeof textureData>>>({});
	const isLoadingNextMap = writable<boolean>(false);

	let loaded = false;

	onMount(async () => {
		let textures: Awaited<ReturnType<typeof textureData>> = await textureData();
		textureStore.set(await textures);

		AudioEngine.loadAudioFile(
			"wondering",
			Soundtrack["Wondering About My Loved Ones"],
			false,
			true
		);
		if ($page.route.id !== "/[...level]") {
			AudioEngine.loadAudioFile("menu", Soundtrack.menu, true, true);
		}
		await gameData.loadResources();
		const level = parseInt($page.url.pathname.slice(-1).toString());
		if ($page.url.pathname.startsWith("E") && typeof level === "number") {
			gameData.loadLevel(level > 0 ? level : level);
		}

		loaded = true;
	});

	setContext(ctxKey, { textures: textureStore, isLoadingNextLevel: isLoadingNextMap } as WSContext);

	let hasAudioPerms = false;
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
		<slot />
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
