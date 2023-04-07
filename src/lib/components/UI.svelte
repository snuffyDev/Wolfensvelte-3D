<script lang="ts">
	import { dev } from "$app/environment";
	import { PlayerState } from "$lib/stores/player";

	let SECTIONS = [
		["Floor", 1],
		["Score", 0],
		["Lives", 3],
		["Player", "@"],
		["Health", $PlayerState.health],
		["Ammo", 8],
		["", ""],
		["Gun", "[insert gun here]"]
	];
</script>

{#if dev}
	<div class="debug">
		{#key $PlayerState.position}
			pos: {JSON.stringify($PlayerState.position)}
		{/key}
	</div>
{/if}
<div class="hud">
	<div class="stats">
		<div class="col">
			<b>Level</b>
			<span>{1}</span>
		</div>
		<div class="col">
			<b>Score</b>
			<span>{$PlayerState.score}</span>
		</div>
		<div class="col">
			<b>Health</b>
			<span>{$PlayerState.health}</span>
		</div>
	</div>
	<!-- <div /> -->
	<!-- </div> -->
</div>

<style lang="scss">
	.stats {
		margin: 0 auto;
		// display: grid;
		// grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 0.1fr 2fr;
		display: flex;
		max-width: 80dvh;
		width: 100%;
		// ju-items: center;
		gap: 0.5em;
		margin: 0 auto;
		justify-items: space-around;
		> :not(:first-child) {
			margin-left: 0.5em;
		}
		> :not(:last-child) {
			// margin-right: 0em;
			margin-right: 0.5em;
		}
		> :nth-last-child(2) {
			margin: 0em;
			// width: 0;
		}
	}
	.col {
		display: inline-flex;
		flex-direction: column;
		// grid-template-rows: 1fr 2fr;
		font-size: 1em;
		// max-width: 100%;
		width: 100%;
		font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
		&:not(:nth-last-child(2)) {
			// width: 100%;
		}
		background: #00009e;
		// text-align: center;
		font-size: 0.7em;

		align-content: center;
		place-items: center;
	}
	.hud {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		text-align: center;
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		// font-size: 0.1rem;
		justify-content: center;
		// grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		// grid-auto-flow: row dense;
		// place-content: center;
		// max-width: 100%;
		width: 100%;
		color: white;
		background-color: #003e3e;
		font-size: 1.5em;
		font-weight: 500;
		height: 4rem;
	}

	.debug {
		background-color: hsla(0, 0%, 0%, 0.7);
		position: fixed;
		top: 2.25rem;
		z-index: 10000;
		left: 0;
		color: #fff;
		width: auto;
		height: 3rem;
	}
</style>
