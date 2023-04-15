<script lang="ts">
	import { dev } from "$app/environment";
	import { page } from "$app/stores";
	import { PlayerState, playerHealth, playerScore } from "$lib/stores/player";
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
			<b />
			<span>{1}</span>
		</div>
		<div class="col">
			<b />
			<span>{$playerScore}</span>
		</div>
		<div class="col">
			<b />
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
			<b />
			<span>{$playerHealth}</span>
		</div>
		<div class="col">
			<b />
			<span>{$PlayerState.weapons.ammo}</span>
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
		&::before {
			background-color: #555;
			z-index: -1;
			position: absolute;
			inset: 0;
			content: "";
		}
		background-size: contain;
		background-repeat: no-repeat;
		background-image: var(--img);
		background-position: center;
		// max-height: 4rem;
		justify-self: center;
		place-self: center;
		height: 100%;
		left: 0;
		right: 0;
		width: 100%;
		bottom: 0;
		top: 0;
		opacity: 0;
		image-rendering: pixelated;

		&.show {
			opacity: 1;
		}
		// max-width: 4rem;
	}
	.stats {
		margin: 0 auto;
		// display: grid;
		display: grid;
		grid-template-columns: 1fr 2fr 1fr 1fr 1.25fr 1.25fr 0.25fr 1.95fr;
		aspect-ratio: 5/3; // grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 0.1fr 2fr;
		// display: flex;
		// flex: 1 1 auto;
		height: inherit;

		width: 100%;
		// ju-items: center;
		text-align: center;
		gap: 4px;
		margin: 0 auto;
		max-width: 60vw;
		padding: 1rem 2rem;
		> :not(:first-child) {
			// margin-left: 0.5em;
		}
		> :not(:last-child) {
			// margin-right: 0em;
			// margin-right: 0.5em;
		}

		background-image: url(../sprites/hud/main.BMP);
		background-repeat: no-repeat;
		background-size: contain;
		background-position: center;
		> :nth-last-child(2) {
			margin: 0em;
			// width: 0;
		}
	}
	.col {
		// display: none;
		grid-template-columns: 1fr;
		contain: layout style paint;

		// grid-template-rows: 1fr 2fr;
		// max-width: 100%;
		position: relative;
		width: 100%;
		display: grid;
		grid-template-rows: 0.25fr 1fr;

		// flex: 1 0 auto;
		// max-width: 5rem;
		// justify-content: center;
		// min-width: 1rem;
		line-height: 1.2;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
			Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
		&:not(:nth-last-child(2)) {
			// width: 100%;
		}
		max-width: 100%;
		// background: #00009e;
		// text-align: center;
		font-size: 2rem;
		// max-height: 1.1rem;
		align-content: center;
		place-items: center;
	}
	.hud {
		position: relative;
		left: 0;
		right: 0;
		bottom: 0;
		text-align: center;
		// display: flex;
		// height: 100%;
		max-height: 100%;
		// justify-content: center;
		width: 100%;
		aspect-ratio: 2/7;
		color: white;
		image-rendering: pixelated;
		// background-color: #003e3e;
		font-size: 16px;
		font-weight: 500;
		contain: strict;
		// height: 100%;
		height: 15vh;
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
