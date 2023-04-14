<script lang="ts">
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";

	export let loading = false;
	const progress = tweened(0, {
		easing: cubicOut
	});
	progress.set(0, { duration: 1000 });

	const opacity = tweened(0, { easing: cubicOut });
	function handleLoading() {
		opacity.set(1, { duration: 0 });
		progress.set(1, { duration: 3000 });
	}
	function handleLoaded() {
		const duration = 3000;

		progress.set(1, { duration });
		opacity.set(0, { duration: duration / 2, delay: duration / 2 });

		setTimeout(() => {}, duration);
	}
	$: loading ? handleLoading() : loading === false ? handleLoaded() : undefined;
</script>

<div
	class="progress-container"
	style={`opacity: ${$opacity}`}
>
	<div
		class="progress"
		style={`--width: ${$progress}`}
	/>
</div>

<style>
	.progress-container {
		position: absolute;
		bottom: 0;
		height: 3rem;
		left: 0;
		width: 100%;
		pointer-events: none;
		contain: paint;
		height: 0.275em;
		z-index: 99999999999;
		will-change: opacity;

		background-color: hsla(345deg, 10%, 18%, 0.3);
	}
	.progress {
		left: 0;
		top: 0;
		height: 100%;
		background-color: #d80000;
		pointer-events: none;
		transform-origin: left;
		transform: scaleX(var(--width));
	}
</style>
