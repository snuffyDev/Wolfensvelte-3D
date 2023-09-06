<script lang="ts">
	import { cubicOut, linear } from "svelte/easing";
	import { fade } from "svelte/transition";

	export let backgroundColor = "#000";
	export let fadeInOut = true;
	export let center = true;

	const fadeFn = (...args: Parameters<typeof fade>) => {
		return fadeInOut ? fade(...args) : (null as never);
	};
</script>

<div
	class:center
	class="background-img"
	style="background-color: {backgroundColor ?? ''};"
	in:fadeFn={{ duration: 700, delay: 700, easing: cubicOut }}
	out:fadeFn={{ duration: 700, easing: cubicOut }}
>
	<slot name="image"><!-- optional fallback --></slot>
	<slot />
</div>

<style lang="scss">
	.background-img {
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
		margin: 0 auto;
		aspect-ratio: 4/3;
		// max-width: 100%;
		max-width: 75rem;
		height: 100%;
		min-height: 0;
		display: grid;
		isolation: isolate;
		z-index: -1;
		&.center {
			place-items: center;
		}
		> :global(img) {
			min-height: 0;
			position: absolute;
			// max-height: 50vh;
			max-width: 100%;
			aspect-ratio: 1/1;
			z-index: -1;
			image-rendering: pixelated;
			// object-fit: contain;
			user-select: none;
			pointer-events: none;
			-webkit-user-drag: none; // object-fit: contain;
			width: 100%;
			height: 100%;
		}
	}
</style>
