<script lang="ts">
	import { goto } from "$app/navigation";
	import MenuImg from "../../lib/sprites/menu/wolf_menu.BMP?url";
</script>

<div class="center">
	<div class="background-img">
		<img src={MenuImg} />
	</div>
	<button
		on:click|once={() => {
			goto("/E1M1");
		}}>Play Wolfensvelte 3D</button
	>
</div>

<style lang="scss">
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
			// height: 100%;
		}
	}
	button {
		font-size: 1.3em;
		padding: 1em;
		border-radius: 0.2em;
	}
</style>
