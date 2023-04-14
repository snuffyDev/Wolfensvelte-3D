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
		class="splashscreen"
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
		min-height: 6rem;
		z-index: var(--z-index);
		background-image: var(--img);
		background-repeat: no-repeat;
		min-width: 29rem;
		// min-height: 100%;
		max-width: 50vw;
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
