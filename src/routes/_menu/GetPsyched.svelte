<script lang="ts">
	import { beforeUpdate, onMount } from "svelte";
	import Progress from "./Progress.svelte";
	import { fade } from "svelte/transition";

	export let imgUrl: string;
	export let zIndex: number = 0;

	export let loadPromise: Promise<void> | undefined;

	let loaded = false;
	let loading = false;
	onMount(() => {
		if (!loading) {
			loading = true;
			setTimeout(() => {
				loaded = true;
			}, 3000);
		}
		if (loadPromise) {
		}
	});
</script>

<div
	class="splash-wrapper"
	out:fade={{ duration: 1500, delay: 250 }}
>
	<div
		class="splashscreen-container"
		style="--z-index: {zIndex}; --aspect-ratio: 16/9"
	>
		<div
			class="splashscreen"
			style="--img: url({`${imgUrl}`}); --z-index: {zIndex};"
		/>
		<Progress loading={!loaded} />
	</div>
</div>

<style lang="scss">
	.splashscreen {
		position: absolute;
		min-height: 11rem;
		height: 100%;
		z-index: var(--z-index);
		background-image: var(--img);
		background-repeat: no-repeat;
		// min-width: 32rem;
		// min-height: 100%;
		width: 100%;
		max-width: 55vw;
		background-size: 100%;
	}
	.splashscreen-container {
		position: absolute;
		min-height: 7rem;
		z-index: var(--z-index);
		background-image: var(--img);
		background-repeat: no-repeat;
		min-width: 32rem;
		// min-height: 100%;
		max-width: 55vw;
		background-size: 100%;
	}
	.splash-wrapper {
		position: absolute;
		display: grid;
		place-items: center;
		z-index: 100000000;
		inset: 0;
		background-color: #004141;
	}
</style>
