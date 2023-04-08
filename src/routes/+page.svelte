<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { E1M1 } from "$lib/utils/map";
	import { onMount } from "svelte";
	import { writable } from "svelte/store";
	import Level from "../lib/components/Level.svelte";
	import E1M1Music from "../lib/music/E1M1.mp3?url";
	import MenuMusic from "../lib/music/menu.mp3?url";
	import { dev } from "$app/environment";
	import MenuImg from "../lib/sprites/menu/wolf_menu.BMP?url";
	import GetPsychedImg from "../lib/sprites/menu/get_psyched.BMP?url";
	import { fade } from "svelte/transition";

	const isPlaying = writable(false);

	let menuMusicPlayer: HTMLAudioElement;
	let get_psyched_promise: Promise<void>;

	let hasAudioPerms = false;

	$: if ($isPlaying) menuMusicPlayer.pause();

	$: if ($isPlaying || dev)
		get_psyched_promise = new Promise((resolve) => {
			setTimeout(resolve, 1500);
		});

	onMount(() => {
		menuMusicPlayer = new Audio(new URL(MenuMusic, import.meta.url).toString());
	});
</script>

<svelte:body
	on:pointerdown={() => {
		if (hasAudioPerms) return;
		if (dev) return;
		hasAudioPerms = true;
		menuMusicPlayer.play();
	}}
/>
{#if $isPlaying || dev}
	<div class="game-container">
		{#if get_psyched_promise}
			{#await get_psyched_promise}
				<div
					out:fade={{ duration: 1500, delay: 250 }}
					class="splash-wrapper"
				>
					<div
						class="get-psyched"
						style="position: absolute; background-image: url({new URL(
							GetPsychedImg,
							import.meta.url
						).toString()});"
					/>
				</div>
			{:then}
				<div class="level">
					<Level level={E1M1} />
				</div>
			{/await}
		{/if}
		<div class="ui">
			<Ui />
		</div>
	</div>
{/if}
{#if !hasAudioPerms && !dev}
	<div class="center">
		<div
			style="color: white; background-color: black;max-width:40vw; max-height:30vh; width:100%;height:100%;"
		>
			<h1>Please click anywhere to allow audio</h1>
			<h2 style="font-weight: 700;"><b>Controls</b></h2>
			<p>WASD to move</p>
			<p>Left/Right arrow keys to turn</p>
			<p>Space to shoot</p>
		</div>
	</div>
{:else if !dev}
	<div
		class="center"
		style="background-image: url({`${MenuImg}`});"
	>
		<button
			on:click|once={() => {
				const audio = new Audio(new URL(E1M1Music, import.meta.url).toString());
				menuMusicPlayer.pause();
				audio.autoplay = true;
				audio.loop = true;
				audio.volume = 0.5;
				audio.play().then(() => {
					audio.play();
				});
				isPlaying.set(true);
			}}>Play Wolfensvelte 3D</button
		>
	</div>
{/if}

<style lang="scss">
	.splash-wrapper {
		position: fixed;
		inset: 0;
		background-color: #004141;
	}
	.get-psyched {
		background-repeat: no-repeat;
		background-size: 100%;
		max-width: 60vw;
		width: 100%;
		aspect-ratio: 224/48;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
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
	button {
		font-size: 1.3em;
		padding: 1em;
		border-radius: 0.2em;
	}
	.game-container {
		display: grid;
		position: relative;
		min-height: 100%;
		// will-change: none;
		// contain: layout;
		// max-width: 100%;
		// width: 100%;/
		grid-template-rows: 1fr 4em;
	}
	.level {
		will-change: transform;
		transform: translateZ(0px);
		transform-style: preserve-3d;
		backface-visibility: hidden;
		position: absolute;
		overflow: visible;
		inset: 0;
	}
	.ui {
		position: relative;
		grid-row: 2;
	}
</style>
