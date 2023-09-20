<script lang="ts">
	import { goto } from "$app/navigation";
	import MenuImg from "$lib/sprites/menu/wolf_menu.BMP?url";
	import PCImg from "../../lib/sprites/menu/profound_carnage.BMP?url";
	import OptionsHeaderImg from "../../lib/sprites/menu/Options.BMP?url";
	import ActiveGun from "../../lib/sprites/menu/gun.bmp?url";
	import InactiveGun from "../../lib/sprites/menu/gun2.bmp?url";
	import BackgroundImage from "../../lib/sprites/menu/Background.BMP?url";
	import Screen from "./components/Screen.svelte";
	import { onMount } from "svelte";
	import { AudioEngine } from "$lib/helpers/music";

	let screenIdx = 0;
	onMount(() => {
		AudioEngine.play("menu", true);
	});

	const clickCallback = () => {
		screenIdx += 1;
		if (screenIdx === 2) {
			AudioEngine.play("wondering", true);
		}
	};
</script>

<svelte:body on:click={clickCallback} />
<div class="center">
	{#if screenIdx === 0}
		<Screen
			fadeInOut
			backgroundColor="#20a8fc"
			center={false}
		>
			<!-- svelte-ignore a11y-missing-attribute -->
			<img
				style="width: 17vw; height: auto; place-self: flex-end; margin: 6.5vw;"
				src={PCImg}
				slot="image"
			/>
		</Screen>
	{:else if screenIdx === 1}
		<Screen fadeInOut>
			<!-- svelte-ignore a11y-missing-attribute -->
			<img
				src={MenuImg}
				slot="image"
			/>
		</Screen>
	{:else}
		<Screen>
			<!-- svelte-ignore a11y-missing-attribute -->
			<img
				src={BackgroundImage}
				style="width: 100%; height: 100%; z-index: -2"
			/>
			<img
				src={OptionsHeaderImg}
				slot="image"
				style="
				height: 100%;
				top:0;
				min-width: 40rem;
				margin-top: 1.4vh;
				max-width: 36vw;
				width: 100%;
				max-height: 24.1vh;"
			/>
			<div
				class="absolute border-inset"
				style="background-color: #590000; bottom: 0; display:flex; flex-direction: column; max-height: 64vh; max-width: 42vw; min-width: 50rem; border:4px inset hsl(0 100% 37% / 1); top: 29vh;"
			>
				<!-- -->
				<button
					style:--hover-img="url({new URL(ActiveGun, import.meta.url).toString()})"
					style:--inactive-img="url({new URL(InactiveGun, import.meta.url).toString()})"
					on:click|once={() => {
						goto("/E1M1");
					}}
					><span style="position:relative; height:100%;"
						><span
							style:background-size="100%"
							style:background-position="center"
							style:background-repeat="no-repeat"
							style:position="absolute"
							style:inset="0"
							style:image-rendering="pixelated"
						/></span
					>
					<span>New Game</span></button
				>
			</div>
			<div class="absolute  bottom" />
		</Screen>
	{/if}
</div>

<style lang="scss">
	@font-face {
		font-family: "Small Pixel-7";
		src: url("$lib/fonts/small_pixel-7.ttf");
	}
	@font-face {
		font-family: "Mini Pixel-7";
		src: url("$lib/fonts/mini_pixel-7.ttf");
	}
	.button,
	button {
		min-height: 2rem;
		padding: 0.25em;
		background-color: transparent;
		border: none;
		display: grid;
		grid-template-columns: 1fr 10fr;
		font-family: "Mini Pixel-7", sans-serif;
		color: #8e8e8e;
		text-align: left;
		gap: 1rem;
		font-weight: 400;
		line-height: 1;
		letter-spacing: 0.01em;
		font-size: 6rem !important;
		transition: color 50ms 50ms ease-out;

		> span > span {
			background-image: var(--inactive-img);
		}
		&:hover,
		&:focus-visible,
		&:focus-within {
			outline: none;
			color: #e2e2e2;
			> span > span {
				background-image: var(--hover-img);
			}
		}
	}
	.absolute {
		position: absolute;
	}
	.inset {
		inset: 0;
	}
	.bottom {
		bottom: 0;
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
		isolation: isolate;
		margin: 0 auto;
	}
	.background-img {
		position: absolute;
		inset: 0;
		max-width: 100%;
		display: grid;
		pointer-events: none;
		user-select: none;
		-webkit-user-drag: none;
		&::before {
			position: absolute;
			inset: 0;
			pointer-events: none;
			content: "";
			z-index: 100;
			width: 100%;
			height: 100%;

			background-color: orange;
		}
		place-items: center;
		img {
			width: 100%;
			max-width: 100%;
			aspect-ratio: 3/2;
			z-index: -1;

			image-rendering: pixelated;
			object-fit: contain;

			user-select: none;
			pointer-events: none;
			-webkit-user-drag: none;
			height: 100%;
		}
	}
</style>
