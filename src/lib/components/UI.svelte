<script lang="ts">
	import { dev } from "$app/environment";
	import { page } from "$app/stores";
	import {
		PlayerState,
		playerAmmo,
		playerHealth,
		playerLives,
		playerScore
	} from "$lib/stores/player";
	import { MapHandler } from "$lib/stores/stats";
	import { frameLoop } from "$lib/utils/raf";
	import { getContext, onDestroy, onMount } from "svelte";

	const FACE_MAP = $page.data.FACES;
	let PORTRAIT_STATE: keyof typeof FACE_MAP = "full";
	let CURRENT_IDX: number = 0;

	$: PORTRAIT_STATE =
		$PlayerState.health > 0 ? $page.data.FACE_KEYS[Math.floor($PlayerState.health / 15)] : "dead";

	let start: number | null = null;

	$: HUD_SECTIONS = [
		["level", $MapHandler],
		["score", $playerScore],
		["lives", $playerLives],
		["portrait", null],
		["health", $playerHealth],
		["ammo", $playerAmmo],
		["gap", null],
		["weapon", null]
	] as const;

	const loop = frameLoop((now) => {
		if (!start) start = now;
		const elapsed = now - start;

		if (elapsed >= 1500) {
			start = now;
			CURRENT_IDX = (CURRENT_IDX + 1) % 3;
		}
		return true;
	});

	onMount(() => {
		return () => loop.abort();
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
		{#key $PlayerState.rotation.y}
			<p>rot: {JSON.stringify($PlayerState.rotation.y)}</p>
			<p>{getFacingDirection($PlayerState.rotation.y)}</p>
		{/key}
	</div>
{/if}
<div class="hud">
	<div class="stats">
		{#each HUD_SECTIONS as [name, value] (name)}
			<div class="col {name}">
				{#if name === "portrait"}
					{#each FACE_MAP[PORTRAIT_STATE] as img, idx (img)}
						<div
							role="img"
							class="portrait {PORTRAIT_STATE}"
							class:show={PORTRAIT_STATE === "dead" ? true : idx === CURRENT_IDX}
							style={FACE_MAP[PORTRAIT_STATE][idx]}
						/>
					{/each}
				{:else if value !== null}
					<b />
					{#if name.match(/lives|score|ammo|health/g)}
						<div class="numbers {name === 'health' ? 'pad' : ''}">
							{#each value.toString() as num}
								<span class="font-{num}" />
							{/each}
						</div>
					{/if}
					<div />
				{/if}
			</div>
		{/each}
		<!-- <div class="col">
			<b />
			<span class="font-{1}" />
		</div>
		<div class="col">
			<b />

			<div class="numbers">
				{#each $playerScore.toString() as num}
					<span class="font-{num}" />
				{/each}
			</div>
		</div>
		<div class="col">
			<b />
			<div class="numbers">
				<span class="font-{$playerLives}" />
			</div>
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
			<div class="numbers pad">
				{#each $playerHealth.toString() as num}
					<span class="font-{num}" />
				{/each}
			</div>
		</div>
		<div class="col">
			<b />

			<div class="numbers">
				{#each $playerAmmo.toString() as num}
					<span class="font-{num}" />
				{/each}
			</div>
		</div>
	</div> -->
		<!-- <div /> -->
	</div>
</div>

<style lang="scss">
	$FACES: (full, low_hp, beat_up, dying, near_death, hurt, dead);
	$BASE_URL: unquote("../sprites/hud/");

	@for $num from 0 through 9 {
		.font-#{$num} {
			background-image: url(#{$BASE_URL}#{$num}.BMP);
			background-repeat: no-repeat;
			background-size: contain;
			width: 0.75em;

			display: inline-block;

			height: 1.5em;
		}
	}

	.numbers {
		// padding: 1rem;
		display: flex;

		flex-direction: row;
		align-items: center;

		justify-content: flex-end;
		&.pad {
			margin-right: 2em;
		}
	}

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
	}
	.stats {
		margin: 0 auto;
		// display: grid;
		display: grid;
		display: grid;
		grid-template-columns: 0.9fr 1.5fr 0.9fr 0.9fr 1fr 0.9fr 0.2fr 1.7fr;
		grid-template-rows: 1fr;
		gap: 0px 0em;
		grid-template-areas: "level score lives player health ammo gap weapon";

		height: inherit;
		width: 100%;
		text-align: center;

		background-image: url(../sprites/hud/main.BMP);
		background-repeat: no-repeat;
		background-size: contain;
		background-position: center;
		> :nth-last-child(2) {
			margin: 0em;
		}
	}
	.col {
		// display: none;
		grid-template-columns: 1fr;
		contain: layout style paint;

		position: relative;
		width: 100%;
		justify-content: center;
		display: grid;
		grid-template-rows: 0.25fr 1fr;
		justify-items: center;

		line-height: 1;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
			Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

		font-size: 1.5em;

		align-content: center;
		place-items: flex-end;

		place-items: flex-end;
		justify-items: center;
		align-items: center;
	}
	.hud {
		position: relative;
		left: 0;
		right: 0;
		bottom: 0;
		text-align: center;

		height: 100%;
		max-height: 100%;

		color: white;

		image-rendering: pixelated;

		font-size: 75%;
		font-weight: 500;

		height: 100%;
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
	.weapon {
		grid-area: weapon;
	}
	.gap {
		grid-area: gap;
	}
	.ammo {
		grid-area: ammo;
	}
	.health {
		grid-area: health;
	}
	.player {
		grid-area: player;
	}
	.lives {
		grid-area: lives;
	}
	.score {
		grid-area: score;
	}
	.level {
		grid-area: level;
	}
</style>
