<script lang="ts">
	import { fade } from "svelte/transition";

	export let imgUrl: string;
	export let zIndex: number = 0;
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

		max-width: 50vw;
		background-size: 100%;
	}
	.splash-wrapper {
		position: absolute;
		display: grid;
		place-items: center;
		inset: 0;
		z-index: 100000000;
		background-color: #004141;
	}
</style>
