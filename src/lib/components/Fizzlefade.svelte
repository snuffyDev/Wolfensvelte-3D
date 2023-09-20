<script lang="ts">
	import { onMount } from "svelte";
	import { cubicOut, sineOut } from "svelte/easing";
	import type { TransitionConfig } from "svelte/transition";
	let image: HTMLDivElement;
	let progress = 0;
	const images = import.meta.glob("../sprites/fizzle/*.png", { eager: true, as: "url" });

	const URLS = Object.values(images)
		.reverse()
		.map((k, idx, a) => `--background-${idx}: url(${new URL(k, import.meta.url).toString()});`);

	onMount(async () => {
		if (image) {
		}
	});

	function fizzlefade(
		node: HTMLElement,
		{ duration, delay }: { duration: number; delay: number }
	): TransitionConfig {
		const visited = new Set<number>();
		return {
			delay,
			easing: cubicOut,
			duration,
			tick: (t) => {
				if (progress === 0) {
					node.innerHTML = "";
				}
				const idx = Math.floor(t * 12);
				progress = idx;
			}
		};
	}
</script>

<div
	class="fizzle"
	style="{URLS.join(' ')};"
	in:fizzlefade={{ duration: 5150, delay: 0 }}
	out:fizzlefade={{ duration: 3100, delay: 3500 }}
	bind:this={image}
>
	{#each Array(progress) as _, idx}
		<div
			class="wrapper"
			style="background-image: var(--background-{Math.min(
				6,
				Math.max(idx > 5 ? (Math.random() < 0.3 ? 5 : 6) : idx, 0)
			)}); opacity: {idx === progress ? 0.1 : sineOut(idx / 6)};"
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

		will-change: background-size, opacity;

		background-size: 20%;

		background-position: center;

		&:first-of-type {
			background-blend-mode: multiply;

			backdrop-filter: contrast(1.2);
		}

		background-attachment: fixed;
		&:first-child,
		&:nth-last-child(n - 1) {
			background-color: rgb(152, 0, 0);
			background-blend-mode: overlay;
			&:not(&:nth-last-child(n-1))::before {
				background-color: #000;
				opacity: 0.1;
				position: absolute;
				inset: 0;
				content: "";
				animation: fade 4s forwards;
				@keyframes fade {
					0% {
						opacity: 0;
					}
					100% {
						opacity: 0.1;
					}
				}
			}
			backdrop-filter: contrast(2.9) opacity(0.1);
			mix-blend-mode: overlay;
			animation-direction: reverse !important;
			opacity: 0.2 !important;

			animation: none;
		}

		&:not(:first-child):not(:last-child) {
			background-blend-mode: multiply;

			background-color: rgb(255, 0, 0);
			opacity: 0.3 !important;
			backdrop-filter: contrast(2.2) invert(100) opacity(0.1);

			mix-blend-mode: multiply;
		}

		contain: strict;
	}
</style>
