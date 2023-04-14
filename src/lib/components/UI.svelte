<script lang="ts">
	import { dev } from "$app/environment";
	import { page } from "$app/stores";
	import { PlayerState } from "$lib/stores/player";
	import { frameLoop } from "$lib/utils/raf";
	import { onDestroy, onMount } from "svelte";

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
	const FACE_MAP = $page.data.FACES;
	let PORTRAIT_STATE: keyof typeof FACE_MAP = "full";
	let CURRENT_IDX: number = 0;

	$: PORTRAIT_STATE =
		$PlayerState.health > 0 ? $page.data.FACE_KEYS[Math.floor($PlayerState.health / 15)] : "dead";

	let start: number | null = null;

	const loop = frameLoop.add(async (now) => {
		if (!start) start = now;
		const elapsed = now - start;

		if (elapsed >= 1500) {
			start = now;
			CURRENT_IDX = (CURRENT_IDX + 1) % 3;
		}
	});

	onMount(() => {
		loop.start();
	});

	function getFacingDirection(angle: number): string {
		angle = angle < 0 ? 360 + angle : angle;
		if (angle >= 315 || angle < 45) {
			return "front";
		} else if (angle >= 45 && angle < 135) {
			return "right";
		} else if (angle >= 135 && angle < 225) {
			return "back";
		} else {
			return "left";
		}
	}
</script>

{#if dev}
	<div class="debug">
		{#key $PlayerState.position}
			<p>pos: {JSON.stringify($PlayerState.position)}</p>
		{/key}
		{#key $PlayerState.rotation.y}
			<p>rot: {JSON.stringify($PlayerState.rotation.y)}</p>
			<p>{getFacingDirection($PlayerState.rotation.y)}</p>
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
			<b>Lives</b>
			<span>{$PlayerState.lives}</span>
		</div>
		<div class="col">
			{#each FACE_MAP[PORTRAIT_STATE] as img, idx}
				<div
					role="img"
					class="portrait {PORTRAIT_STATE}"
					class:show={PORTRAIT_STATE === "dead" ? true : idx === CURRENT_IDX}
					style={FACE_MAP[PORTRAIT_STATE][idx]}
				/>
			{/each}
		</div>
		<div class="col">
			<b>Health</b>
			<span>{$PlayerState.health}%</span>
		</div>
		<div class="col">
			<b>Ammo</b>
			<span>{$PlayerState.weapons.pistol?.ammo}</span>
		</div>
	</div>
	<!-- <div /> -->
	<!-- </div> -->
</div>

<style lang="scss">
	$FACES: (full, low_hp, beat_up, dying, near_death, hurt, dead);
	.portrait {
		position: absolute;
		inset: 0;
		background-size: contain;
		background-repeat: no-repeat;
		background-image: var(--img);
		max-height: 4rem;
		// justify-self: center;
		height: 4rem;
		min-height: 100%;
		width: 100%;
		bottom: unset;
		opacity: 0;
		&.show {
			opacity: 1;
		}
		// max-width: 4rem;
	}
	.stats {
		margin: 0 auto;
		// display: grid;
		display: grid;
		grid-template-columns: 5rem 7rem 5rem 3rem 5rem 5rem;
		// grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 0.1fr 2fr;
		// display: flex;
		// flex: 1 1 auto;
		max-width: 80dvh;
		width: 100%;
		// ju-items: center;

		gap: 0.5em;
		margin: 0 auto;
		justify-items: space-around;
		> :not(:first-child) {
			// margin-left: 0.5em;
		}
		> :not(:last-child) {
			// margin-right: 0em;
			// margin-right: 0.5em;
		}
		> :nth-last-child(2) {
			margin: 0em;
			// width: 0;
		}
	}
	.col {
		display: inline-grid;
		grid-template-columns: 1fr;

		// grid-template-rows: 1fr 2fr;
		font-size: 1em;
		// max-width: 100%;
		max-height: 5rem;
		position: relative;
		width: 100%;
		// flex: 1 0 auto;
		// max-width: 5rem;
		// justify-content: center;
		min-width: 1rem;
		line-height: 1.7;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
			Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
		&:not(:nth-last-child(2)) {
			// width: 100%;
		}
		background: #00009e;
		// text-align: center;
		font-size: 0.7em;

		// align-content: center;
		// place-items: center;
	}
	.hud {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		text-align: center;
		display: grid;
		// grid-template-columns: 2rem 4rem 3rem 2rem 3rem 3rem;
		// grid-template-columns: 1fr;
		// align-items: center;
		// font-size: 0.1rem;
		// justify-content: center;
		// grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		// grid-auto-flow: row dense;
		// place-content: center;
		// flex: 1 1;
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
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 2.25rem;
		z-index: 10000;
		left: 0;
		color: #fff;
		width: auto;
		height: 3rem;
	}
</style>
