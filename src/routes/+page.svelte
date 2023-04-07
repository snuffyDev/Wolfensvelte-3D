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

	let menuMusicPlayer: HTMLAudioElement;
	onMount(() => {
		menuMusicPlayer = new Audio(new URL(MenuMusic, import.meta.url).toString());
	});
	let hasAudioPerms = false;
	const play = writable(false);
	// $:if (hasAudioPerms) menuMusicPlayer.play()
	$: if ($play) menuMusicPlayer.pause();
</script>

<svelte:body
	on:pointerdown={() => {
		if (hasAudioPerms) return;
		if (dev) return;
		hasAudioPerms = true;
		menuMusicPlayer.play();
	}}
/>
{#if $play || dev}
	<div class="game-container">
		<div class="level">
			<Level level={E1M1} />
		</div>
		<div class="ui">
			<Ui />
		</div>
	</div>
{/if}
{#if !hasAudioPerms && !dev}
	<div
		class="center"
		style="color: white; background-color: black;max-width:40vw; max-height:30vh; width:100%;height:100%;"
	>
		<h1>Please click anywhere to allow audio</h1>
		<h2 style="font-weight: 700;"><b>Controls</b></h2>
		<p>WASD to move</p>
		<p>Left/Right arrow keys to turn</p>
		<p>Space to shoot</p>
	</div>
{:else}
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
				audio.volume = 0.6;
				audio.play().then(() => {
					audio.play();
				});
				play.set(true);
			}}>Play Wolfensvelte 3D</button
		>
	</div>
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
	button {
		font-size: 1.3em;
		padding: 1em;
		border-radius: 0.2em;
	}
	.game-container {
		display: grid;
		// position: relative;
		min-height: 100%;
		// will-change: none;

		// max-width: 100%;
		// width: 100%;/
		grid-template-rows: 1fr 4em;
	}
	.level {
		will-change: transform;
		transform: translateZ(0px);
		transform-style: preserve-3d;
		backface-visibility: hidden;
		position: relative;
		overflow: visible;
		inset: 0;
	}
	.ui {
		position: relative;
	}
</style>
