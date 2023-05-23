<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { getContext, onMount, tick } from "svelte";
	import { writable } from "svelte/store";
	import MenuMusic from "$lib/music/menu.mp3?url";
	import MenuImg from "$lib/sprites/menu/wolf_menu.BMP?url";
	import GetPsychedImg from "$lib/sprites/menu/get_psyched.BMP?url";
	import Fizzlefade from "$lib/components/Fizzlefade.svelte";
	import { PlayerState, createPlayerState, playerHealth } from "$lib/stores/player";
	import { clear_loops, frameLoop } from "$lib/utils/raf";
	import { GameObjects } from "$lib/utils/manager";
	import GetPsyched from "../_menu/GetPsyched.svelte";
	import { LevelHandler, MapHandler } from "$lib/stores/stats";
	import { fade } from "svelte/transition";
	import { MusicManager } from "$lib/helpers/music";
	import {
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import Scene from "$lib/components/Scene.svelte";
	import { afterNavigate, beforeNavigate, goto, invalidate } from "$app/navigation";
	import { ctxKey, type WSContext } from "../key";
	import { page as _page } from "$app/stores";
	import type { Position, Position2D } from "$lib/types/position";
	import Joystick from "$lib/components/Controls/Joystick.svelte";
	import Level, {
		CurrentLevel,
		createExtendedWorld,
		removeConnectedSurfaces
	} from "$lib/components/Level.svelte";
	export let data;

	$: ({ page } = data);
	const isPlaying = writable(false);

	let menuMusicPlayer: HTMLAudioElement;
	let get_psyched_promise: Promise<void>;

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;

	let spawn: Partial<Position2D> = {};

	let initialized = false;
	const showSplashscreen = async () => {
		// $CurrentLevel = [];
		// if (!initialized) initialized = true;
		// if (initialized) return;
		get_psyched_promise = new Promise((r) => {
			// $isPlaying = true;
			setTimeout(r, 2500);
		});
		if (page !== MapHandler.currentMapName) {
			goto(MapHandler.currentMapName);
		}
	};

	$: if ($LevelHandler.isComplete === true) {
		LevelHandler.reset();
		isLoadingNextLevel.set(true);
		setTimeout(() => {
			MapHandler.nextMap();
			GameObjects.reset();
			tick().then(() => {
				showSplashscreen();
			});
		}, 4000);
	}
	$: if ($playerHealth <= 0) {
		isLoadingNextLevel.set(true);
		setTimeout(() => {
			$isPlaying = false;
			showSplashscreen();

			tick().then(() => {
				PlayerState.init(
					{
						rotation: { ...$PlayerState.rotation, y: page === "E1M1" ? 270 : 180 },
						position: { ...(spawn as Position2D), y: 0 },
						lives: $PlayerState.lives! - 1
					},
					true
				);
			});
		}, 4500);
	}

	afterNavigate((data) => {
		if (data.from?.route?.id === "/menu") return;
		clear_loops();
		GameObjects.reset();
		LevelHandler.reset();
	});

	const onMounted = async () => {
		MusicManager.play(page, true);
		console.log(page);
		// Asynchronously load here to ensure the map is ready to go
		spawn = await import("$lib/utils/map")
			.then((mod) => mod[$_page.params.level as keyof typeof mod])
			.then((level) => {
				const extendedRoom = createExtendedWorld(level["data"]);

				removeConnectedSurfaces(extendedRoom);
				return { spawn: level.spawn, extendedRoom };
			})
			.then((level) => {
				CurrentLevel.set(level.extendedRoom);
				return level.spawn;
			})
			.finally(() => {
				isLoadingNextLevel.set(false);
			});
		PlayerState.init({
			...$PlayerState,
			position: { ...(spawn as Position2D), y: 0 }
		});
	};

	$: page, onMounted();

	onMount(() => {
		isLoadingNextLevel.set(false);
		MapHandler.changeMap(page);
		MusicManager.play(page, true);
	});
</script>

{#key page}
	{#await get_psyched_promise}
		<GetPsyched
			--aspect-ratio="16/9"
			imgUrl={new URL(GetPsychedImg, import.meta.url).toString()}
			loadPromise={get_psyched_promise}
			zIndex={1000}
		/>
	{:then _}
		<div class="game-container">
			{#if !$LevelHandler.isComplete}
				<div class="level-wrapper">
					<div class="level">
						{#if $playerHealth <= 0}
							<Fizzlefade />
						{/if}
						<Scene />
					</div>
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

			<div class="joystick">
				<Joystick
					style="justify-self:flex-start;"
					type="move"
				/>
				<Joystick
					style="justify-self:flex-end;"
					type="turn"
				/>
			</div>
		</div>
	{/await}
{/key}

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
		display: grid;
		// flex-direction: column;
		@media screen and (pointer: fine), screen and (orientation: portrait) and (pointer: coarse) {
			min-height: 100%;
		}

		background-color: #003e3e;
		// max-width: 57vw;
		// margin: 0 auto;
		// justify-content: center;
		width: 100%;
		// margin: 0 auto;
		inset: 0;
		grid-template-rows: minmax(15rem, 1fr) 0.3fr 1fr;
		@media screen and (min-width: 720px) {
			grid-template-rows: 1fr max-content;
		}
	}
	.level-wrapper {
		// height: 100%;
		display: flex;
		flex-direction: column;
		width: 100%;
		// margin: auto;
		contain: strict;
		// max-width: 100vw;
		position: relative;
		aspect-ratio: 1/1;
		max-width: 95vw;
		@media screen and (min-width: 720px) {
			margin: auto;
			font-size: 1rem;
			aspect-ratio: 16/9;
			// min-height: 100%;
			max-width: 78vw;
			width: 100%;
			// max-height: 100vh;
		}
		@media screen and (pointer: coarse) and (orientation: landscape) {
			max-width: 100%;
		}
	}

	.joystick {
		padding: 10vw;
		// gap: calc(33% - 3.5vw);
		width: 80%;
		display: grid;
		margin-bottom: 1rem;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1.5fr;
		pointer-events: none;
		// z-index: -1;
		// isolation: isolate;
		@media screen and (orientation: landscape) and (pointer: coarse) {
			display: grid !important;
			position: fixed;
			width: 95vw;
			bottom: 0;

			margin: 0;
			grid-template-columns: 1.5fr 1fr;
			grid-template-rows: 1fr;
		}
		@media screen and (pointer: fine) and (min-width: 720px) {
			display: none !important;
		}

		&:nth-child(1) {
			// margin-left: 3vw;
			// margin-bottom: 3vw;
		}
	}

	.level {
		transform: translate3d(0px, 0px, 0px);
		transform-style: preserve-3d;
		inset: 0;
		contain: strict;

		backface-visibility: hidden;
		// display: flex;
		background-color: rgb(52, 52, 52) !important;
		width: 97%;
		height: 100%;

		// width: 75vw;

		@media screen and (orientation: landscape) and (pointer: coarse) {
			height: 100vh;
			width: 100vw;
		}
		position: absolute;
		// flex-direction: column; // overflow: hidden;
	}
	.ui {
		position: relative;
		// grid-row: /2;
		height: 8vw;
		// padding: 1vw;
		display: flex;
		// flex: 0 1;
		max-width: 75%;
		margin: 0 auto;
		width: 100%;
	}
</style>
