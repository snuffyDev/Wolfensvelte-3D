<script
	context="module"
	lang="ts"
>
	const LEVEL_NUMS = [...Array(10).keys()].map((v) => v + 1) as [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	type LevelNumber = (typeof LEVEL_NUMS)[number];
	const MAPS: `E1M${LevelNumber}`[] = LEVEL_NUMS.map((num) => `E1M${num}` as const);

	const getNextMap = (map: `E1M${LevelNumber}`): (typeof MAPS)[number] | null => {
		const idx = MAPS.indexOf(map);
		if (idx === -1) return null;
		return MAPS[idx + 1];
	};
</script>

<script lang="ts">
	import Ui from "$lib/components/UI.svelte";
	import { getContext, onMount, tick } from "svelte";
	import { writable } from "svelte/store";
	import GetPsychedImg from "$lib/sprites/menu/get_psyched.BMP?url";
	import Fizzlefade from "$lib/components/Fizzlefade.svelte";
	import { PlayerState, playerHealth, playerState } from "$lib/stores/player";
	import { GameObjects } from "$lib/utils/manager";
	import GetPsyched from "../_menu/GetPsyched.svelte";
	import { LevelHandler } from "$lib/stores/stats";
	import { AudioEngine } from "$lib/helpers/music";
	import Scene from "$lib/components/Scene.svelte";
	import { afterNavigate, goto } from "$app/navigation";
	import { ctxKey, type WSContext } from "../key";
	import { page as _page } from "$app/stores";
	import Joystick from "$lib/components/Controls/Joystick.svelte";
	import { CurrentLevel, type WorldState } from "$lib/components/Level.svelte";
	import { gameData } from "$lib/helpers/maps";
	import { Soundtrack } from "$lib/music";

	export let data;

	let page: (typeof MAPS)[number];
	// @ts-expect-error it's fine
	$: ({ page } = data);

	let skipSplashscreen = false;

	let get_psyched_promise: Promise<boolean> = Promise.resolve(false);

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;

	let spawn: Partial<WorldState["spawn"]> = {};

	async function showSplashscreen(skip = false) {
		skipSplashscreen = skip;
		return (get_psyched_promise = new Promise<boolean>((r) => {
			setTimeout(() => r(skipSplashscreen), !showSplashscreen ? 0 : 2500);
		}));
	}

	const handlePlayerDeath = async (death = true) => {
		get_psyched_promise = showSplashscreen(true);

		gameData.loadLevel(+$_page.url.pathname.slice(-1) - 1);
		PlayerState.init(
			{
				health: 100,
				weapons: death
					? {
							pistol: { acquired: true },
							smg: { acquired: false },
							ammo: 8,
							active: "pistol"
					  }
					: { ...$PlayerState.weapons },
				lives: death ? $PlayerState.lives! - 1 : $PlayerState.lives!
			},
			true
		);
		CurrentLevel.set();
		isLoadingNextLevel.set(false);
	};

	afterNavigate((data) => {
		if (data.from?.route?.id === "/menu") return;
		LevelHandler.reset();
	});

	const onMounted = async () => {
		AudioEngine.play(page, true);
		isLoadingNextLevel.set(false);
		PlayerState.init({
			...$PlayerState,
			rotation: { y: 0, x: 0, z: 0 },
			position: { x: 0, z: 0, y: 0 }
		});
		let level = +page.slice(3);
		const episode = +page.slice(1, 2);
		switch (episode) {
			case 1:
				level += 0;
				break;
			case 2:
				level += 10;
				break;

			case 3:
				level += 20;
				break;

			case 4:
				level += 30;
				break;

			case 5:
				level += 40;
				break;

			case 6:
				level += 50;
				break;

			default:
				level += 0;
				break;
		}
		gameData.loadLevel(+level - 1);
		CurrentLevel.set();

		const { rotation, ...rest } = spawn;
	};
	$: {
		if ($playerHealth === 0) {
			GameObjects.reset();
			LevelHandler.reset();
			isLoadingNextLevel.set(true);
			setTimeout(() => {
				handlePlayerDeath();
			}, 4500);
		}
		if ($LevelHandler.isComplete === true) {
			GameObjects.reset();
			isLoadingNextLevel.set(true);
			const currentIndex = $LevelHandler.level;
			setTimeout(() => {
				LevelHandler.reset();
				tick().then(async () => {
					showSplashscreen();
					await goto(currentIndex === 10 ? `/E1M10` : `/${getNextMap(page)}` ?? "/E1M1");
				});
			}, 4000);
		}
	}
	$: page, onMounted();
	let showFizzle = false;
	onMount(async () => {
		AudioEngine.loadAudioFile(page, Soundtrack[page], true, true);
		isLoadingNextLevel.set(false);
		AudioEngine.play(page, true);
		get_psyched_promise = showSplashscreen();
	});
</script>

{#if $playerHealth <= 0}
	<Fizzlefade />
{/if}
{#key get_psyched_promise}
	{#await get_psyched_promise}
		{#if skipSplashscreen === false}
			<GetPsyched
				--aspect-ratio="16/9"
				imgUrl={new URL(GetPsychedImg, import.meta.url).toString()}
				loadPromise={get_psyched_promise}
				zIndex={1000}
			/>
		{/if}
	{:then _}
		<div
			class="game-container"
			class:hurt={$playerState === "hurt"}
			class:pickup={$playerState === "pickup"}
		>
			{#if !$LevelHandler.isComplete}
				<div class="level-wrapper">
					<div class="level">
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
		}
	}
	button {
		font-size: 1.3em;
		padding: 1em;
		border-radius: 0.2em;
	}

	.game-container {
		display: grid;

		@media screen and (pointer: fine), screen and (orientation: portrait) and (pointer: coarse) {
			min-height: 100%;
		}

		background-color: #003e3e;

		width: 100%;

		inset: 0;
		grid-template-rows: minmax(15rem, 1fr) 0.3fr 1fr;
		@media screen and (min-width: 720px) {
			grid-template-rows: 1fr max-content;
		}
		&::before {
			content: "";
			background-color: rgba(255, 0, 0, 0);
			position: absolute;
			inset: 0;
			width: 100vw;
			height: 100vh;

			pointer-events: none;
			z-index: 5;
			transition: background-color ease-out 100ms;
		}
		&.hurt::before {
			background-color: rgba(255, 0, 0, 0.114);
		}
		&.pickup::before {
			background-color: rgba(255, 251, 0, 0.114);
		}
	}
	.level-wrapper {
		display: flex;
		flex-direction: column;
		width: 100%;

		contain: strict;

		position: relative;
		aspect-ratio: 1/1;
		max-width: 95vw;
		height: 100%;
		@media screen and (min-width: 720px) {
			margin: auto;
			font-size: 1rem;
			aspect-ratio: 16/9;

			max-width: 78vw;
			width: 100%;
		}
		@media screen and (pointer: coarse) and (orientation: landscape) {
			max-width: 100%;
		}
	}

	.joystick {
		padding: 10vw;

		width: 80%;
		display: grid;
		margin-bottom: 1rem;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1.5fr;

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
	}

	.level {
		transform: translate3d(0px, 0px, 0px);
		transform-style: preserve-3d;
		inset: 0;
		contain: strict;

		backface-visibility: hidden;

		background-color: rgb(52, 52, 52) !important;
		width: 97%;
		height: 100%;

		@media screen and (orientation: landscape) and (pointer: coarse) {
			height: 100vh;
			width: 100vw;
		}
		position: absolute;
	}
	.ui {
		position: relative;

		height: 8vw;

		display: flex;

		max-width: 75%;
		margin: 0 auto;
		width: 100%;
	}
</style>
