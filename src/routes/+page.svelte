<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { E1M1 } from "$lib/utils/map";
	import { onMount, tick } from "svelte";
	import { writable } from "svelte/store";
	import Level, { CurrentLevel } from "../lib/components/Level.svelte";
	import E1M1Music from "../lib/music/E1M1.mp3?url";
	import MenuMusic from "../lib/music/menu.mp3?url";
	import MenuImg from "../lib/sprites/menu/wolf_menu.BMP?url";
	import GetPsychedImg from "../lib/sprites/menu/get_psyched.BMP?url";
	import Fizzlefade from "$lib/components/Fizzlefade.svelte";
	import { PlayerState, playerHealth } from "$lib/stores/player";
	import { frameLoop } from "$lib/utils/raf";
	import { GameObjects } from "$lib/utils/manager";
	import GetPsyched from "./_menu/GetPsyched.svelte";
	import { LevelHandler } from "$lib/stores/stats";
	import { fade } from "svelte/transition";

	const isPlaying = writable(false);

	let menuMusicPlayer: HTMLAudioElement;
	let get_psyched_promise: Promise<void>;

	let hasAudioPerms = false;
	let initialized = false;

	$: if ($isPlaying) menuMusicPlayer.pause();

	const showSplashscreen = () => {
		frameLoop.dispose();
		if (!initialized) initialized = true;
		$CurrentLevel = [];
		GameObjects.reset();

		$isPlaying = true;
		get_psyched_promise = new Promise((r) => {
			setTimeout(r, 2500);
		});
	};

	$: if ($isPlaying && !initialized) showSplashscreen();
	$: if ($playerHealth <= 0) {
		frameLoop.dispose();
		setTimeout(() => {
			$isPlaying = false;

			tick().then(() => {
				PlayerState.init();
				showSplashscreen();
			});
		}, 4500);
	}

	onMount(() => {
		menuMusicPlayer = new Audio(new URL(MenuMusic, import.meta.url).toString());
		menuMusicPlayer.volume = 0.5;
	});
</script>

<svelte:body
	on:pointerdown={() => {
		if (hasAudioPerms) return;
		hasAudioPerms = true;
		menuMusicPlayer.play();
	}}
/>
{#if $isPlaying}
	<div class="game-container">
		{#if !$LevelHandler.isComplete}
			<div
				class="level"
				out:fade
			>
				{#await get_psyched_promise}
					<GetPsyched
						--aspect-ratio="16/9"
						imgUrl={new URL(GetPsychedImg, import.meta.url).toString()}
						loadPromise={get_psyched_promise}
						zIndex={1000}
					/>
				{:then _}
					{#if $PlayerState.health <= 0}
						<Fizzlefade />
					{/if}
					<Level level={E1M1} />
				{/await}
			</div>
		{:else}<div
				class="level"
				style="background-color: #0000 !important; position:absolute; inset: 0;"
			>
				<div
					class="end-splash"
					style="background-image: url(/src/lib/sprites/menu/EndScreen.BMP); background-repeat: no-repeat; background-size: 100%; width: 300px; height: 300px; position: absolute; top: 0; left: 0; background-color: #0000;"
				/>
			</div>
		{/if}
		<div class="ui">
			<Ui />
		</div>
	</div>
{/if}
{#if !$isPlaying}
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
		<div class="center">
			<div class="background-img">
				<img src={MenuImg} />
			</div>
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
	.background-img {
		position: absolute;
		inset: 0;
		z-index: -1;
		display: grid;
		place-items: center;
		img {
			aspect-ratio: 4/3;
			width: 100%;
			// height: 100%;
		}
	}
	button {
		font-size: 1.3em;
		padding: 1em;
		border-radius: 0.2em;
	}
	.game-container {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		background-color: #003e3e;
		max-width: 57vw;
		margin: 0 auto;

		contain: content;
		width: 100%;
		inset: 0;
		// grid-template-rows: 1fr 15vh;
	}
	.level {
		// contain: content;
		overflow: hidden;
		transform: translateZ(0px);
		transform-style: flat;
		aspect-ratio: 4/3;
		inset: 0;
		max-width: 55vw;
		width: 100%;
		backface-visibility: hidden;
		// position: absolute;
		// display: flex;
		background-color: rgb(52, 52, 52) !important;
		// width: 97%;
		margin: auto;
		height: 95%;
		position: relative;
		// will-change: contents;
		// flex-direction: column; // overflow: hidden;
	}
	.ui {
		position: relative;
		grid-row: 2;
	}
</style>
