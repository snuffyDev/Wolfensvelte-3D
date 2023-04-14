<script lang="ts">
	import { onMount } from "svelte";
	import { cubicOut, sineOut } from "svelte/easing";
	let image: HTMLDivElement;
	let progress = 0;
	const images = import.meta.glob("../sprites/fizzle/*.png", { eager: true, as: "url" });

	const URLS = Object.values(images)
		.reverse()
		.map((k, idx, a) => `--background-${idx}: url(${new URL(k, import.meta.url).toString()});`);

	onMount(async () => {
		if (image) {
			fizzlefade();
		}
	});
	function fizzlefade() {
		let start = performance.now();

		function animate(timestamp: number) {
			const elapsed = timestamp - start;
			if (progress >= 6) return;
			if (elapsed > 325 && progress < 6) {
				progress += 1;
				start = timestamp;
			}
			requestAnimationFrame(animate);
			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		}

		requestAnimationFrame(animate);
	}
</script>

<div
	class="fizzle"
	style="{URLS.join(' ')};"
	bind:this={image}
>
	{#each Array(progress) as _, idx (idx)}
		<div
			class="wrapper"
			style="background-image: var(--background-{idx}); opacity: {idx === progress
				? 0.1
				: sineOut(idx / 5)};"
		/>
	{/each}
</div>
<slot><!-- optional fallback --></slot>

<style lang="scss">
	.wrapper,
	.fizzle {
		position: absolute;
		inset: 0;
		z-index: 10000;
	}
	.wrapper {
		position: absolute;
		inset: 0;
		z-index: 10000;
		opacity: 0;
		transform: translateZ(0);
		// backdrop-filter: contrast(0.1);
		will-change: background-size, opacity;
		// background-image: linear-gradient(90deg, #0000, #fff);
		background-size: 10%;
		// background-repeat: repeat;\
		background-position: center;
		// animation: fizzlefade 3s ease infinite backwards;
		// background-blend-mode: multiply;
		&:first-of-type {
			background-blend-mode: multiply;
			// mix-blend-mode: soft-light;
			backdrop-filter: contrast(1.2);

			// backdrop-filter: contrast(0.5);
			// mix-blend-mode: hard-light;
			// backdrop-filter: contrast(0.2) opacity(0);
		}
		// background-color: red;

		background-attachment: fixed;
		&:first-child,
		&:nth-last-child(n - 1) {
			background-color: rgb(152, 0, 0);
			background-blend-mode: overlay;
			// background-color: black;
			backdrop-filter: contrast(5.9) opacity(0.6);
			mix-blend-mode: darken;
			animation-direction: reverse !important;
			opacity: 0.2 !important;
			// animation: none;
			animation: none;
			// background-color: black;
		}

		&:not(:first-child):not(:last-child) {
			// animation: none !important;
			background-blend-mode: multiply;
			// mix-blend-mode: hard-light;
			background-color: rgb(255, 0, 0);
			opacity: 0.3 !important;
			backdrop-filter: contrast(2.2) invert(100) opacity(0.1);
			// background-blend-mode: hard-light;
			// background-blend-mode: luminosity;
			mix-blend-mode: multiply;
			// animation-direction: alternate-reverse;
			// animation-direction: reverse;
		}
		@keyframes fizzlefade {
			0% {
				opacity: 0.5;
				transform: scale(1.5);
				// transform: scale(1);
				// background-size: 0vw;
			}

			10% {
				transform: scale(1.1);
				// opacity: 0.3;
				// opacity: 0.1;
				// mix-blend-mode: darken;
				// border-radius: 9999em;
				opacity: 0.4;
				// background-size: 30vw;
			}

			20% {
				transform: scale(1.1);
				// transform: scaleX(1);
				background-size: 13%;
				opacity: 0.05;
			}

			50% {
				border-radius: 0;
				// transform: scale(1, 1) rotate(-360deg);
				background-size: 11%;
				transform: scale(1);
				// opacity: 0.7;

				opacity: 0.5;
				// background-size: 12vw;
			}

			60% {
				// background-size: 9.5%;
				opacity: 0.5;
				transform: scaleX(1);
				// background-size: 25vw;
			}
			100% {
				background-size: 10.5%;
				opacity: 0.5;
				transform: scaleX(1);
				// background-size: 20vw;
			}
		}
		contain: strict;
	}
</style>
