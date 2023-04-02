<script lang="ts">
	import { browser } from "$app/environment";
	import Ui from "../../lib/components/UI.svelte";
</script>

<Ui />
{#if browser}
	{#await import("./components/Editor.svelte") then Editor}
		<svelte:component this={Editor.default} />
	{/await}
{/if}

<style lang="scss">
	#scene {
		width: 100%;
		height: 100%;
		// perspective: 64px;
		overflow: hidden;
		backface-visibility: hidden;
		// position: absolute;
		/* Sky texture */
	}
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
	.floor {
		min-width: 100%;
		min-height: 400px;

		backface-visibility: visible;
		position: absolute;
		bottom: 0;
		backface-visibility: hidden;
	}

	html,
	body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}

	html,
	body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		perspective: 64px;
		transform-style: preserve-3d !important;
		position: absolute !important;
		inset: 0;
	}
	#scene {
		width: 100%;
		height: 100%;
		perspective: 64px;
		overflow: hidden;

		/* Sky texture */
		background-size: cover;
	}

	#camera,
	#world {
		position: fixed;
		inset: 0;
		// top: 150% !important;
		// left: 50% !important;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}
	.wall,
	.floor {
		position: absolute;
		left: 50%;
		top: 50%;
		backface-visibility: hidden;
		// background-size: ;
		/* For the instruction text */
		font-family: sans-serif;
		font-size: 3em;
		text-align: center;
		line-height: 300px;
		color: rgba(50, 50, 50, 0.6);

		/* How to treat the textures */
		background-size: 100%;
		background-repeat: repeat;
		background-color: #333;
	}
</style>
