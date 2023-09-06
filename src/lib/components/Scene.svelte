<svelte:options immutable={true} />

<script lang="ts">
	import { onMount, tick } from "svelte";
	import Level from "./Level.svelte";
	import Player from "./Player.svelte";
	import { PlayerState, playerLives } from "$lib/stores/player";
	import { skipFirstInvocation } from "$lib/utils/skipFirst";

	let offsetWidth: number;
	let worldRef: HTMLElement | null = null;

	let MO: MutationObserver;

	const getMutationCallback = () => {
		let once = false;
		let firstValue: string | null = null;
		let count = -1;
		return skipFirstInvocation((entries) => {
			for (const entry of entries) {
				const target = entry.target as HTMLElement;
				if (firstValue === null) {
					firstValue = target.getAttribute("style");
					++count;
				} else {
					if (++count > 2) MO.disconnect();

					if (entry.oldValue === firstValue) {
						worldRef = document.querySelector("#world");
						const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };
						if (worldRef) worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
					}
				}
			}
		});
	};

	let mutationCallback;

	onMount(() => {
		mutationCallback = getMutationCallback();
		MO = new MutationObserver(mutationCallback);
		tick().then(() => {
			worldRef = document.querySelector<HTMLElement>("#world");

			MO.observe(worldRef!, { attributeFilter: ["style"], attributeOldValue: true });
		});
		return () => {
			MO.disconnect();
		};
	});
</script>

<div
	id="scene"
	bind:offsetWidth
	style={offsetWidth < 720 ? "transform: scale(0.6, 0.6)" : ""}
>
	<Player>
		<div
			class="world"
			id="world"
		>
			<Level bind:worldRef />
			<div class="floor" />
		</div>
	</Player>
</div>

<style lang="scss">
	#scene {
		perspective: calc(var(--perspective));
		position: fixed;
		will-change: contents;
		width: 100%;
		isolation: isolate;
		inset: 0;
		height: 100%;
		backface-visibility: hidden;
	}

	#world {
		position: fixed;
		top: 50% !important;
		left: 50% !important;
		inset: 0;
		backface-visibility: hidden;

		transform-style: preserve-3d;
	}
</style>
