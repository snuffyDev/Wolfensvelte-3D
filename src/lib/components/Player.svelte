<script lang="ts">
	import { PlayerState, type PlayerControls } from "$lib/stores/player";
	import { frameLoop } from "$lib/utils/raf";
	import { createEventDispatcher, onDestroy } from "svelte";

	const dispatch = createEventDispatcher<{ shoot: void }>();
	let buttonsPressed: PlayerControls = {
		w: false,
		shift: false,
		s: false,
		a: false,
		d: false,
		leftarrow: false,
		rightarrow: false
	};

	let cssText = ``;

	const f = frameLoop.add(() => {
		const { x: a, y: b, z: c } = $PlayerState.rotation;

		// if (moving) {
		PlayerState.update(buttonsPressed);
		// }

		cssText = `transform: translate3d(0px, 0px, var(--perspective)) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg);`;
	});

	f.start();

	onDestroy(() => {
		f.stop();
	});

	async function requestPointerLock(e: MouseEvent) {
		const target = e.target as HTMLElement;
		await target.requestPointerLock();
	}

	let x: number = 0;
	function handleMouseMove(node: HTMLElement) {
		function handleMove(event: MouseEvent) {
			x = event.movementX;
			// console.log({ dx, x });
			if (x < -1) {
				buttonsPressed.leftarrow = true;
				buttonsPressed.rightarrow = false;
			} else if (x > 1) {
				buttonsPressed.rightarrow = true;
				buttonsPressed.leftarrow = false;
			} else {
				buttonsPressed.rightarrow = false;
				buttonsPressed.leftarrow = false;
			}
			buttonsPressed = { ...buttonsPressed };
		}
		const mouseOut = () => {
			buttonsPressed.leftarrow = false;
			buttonsPressed.rightarrow = false;
		};
		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseout", mouseOut);
		return {
			destroy() {
				window.removeEventListener("mousemove", handleMove);
				window.removeEventListener("mouseout", mouseOut);
			}
		};
	}
	let moving = false;
</script>

<svelte:window
	on:keydown={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "w":
			case "arrowup":
				moving = true;

				b.w = true;
				break;
			case "s":
			case "arrowdown":
				moving = true;
				b.s = true;
				break;
			case "a":
				moving = true;
				b.a = true;
				break;
			case " ":
			case "space":
				dispatch("shoot");
				break;
			case "d":
				moving = true;
				b.d = true;
				break;
			case "arrowleft":
				b.leftarrow = true;
				break;
			case "shift":
				b.shift = true;
				break;
			case "arrowright":
				b.rightarrow = true;
				break;
		}
		// if (e.repeat) return;
		// buttonsPressed = { ...b };
	}}
	on:keyup={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "w":
			case "arrowup":
				b.w = false;
				break;
			case "s":
			case "arrowdown":
				b.s = false;
				break;
			case "a":
				b.a = false;
				break;
			case "d":
				b.d = false;
				break;
			case "arrowleft":
				b.leftarrow = false;
				break;
			case "shift":
				b.shift = false;
				break;
			case "arrowright":
				b.rightarrow = false;
				break;
		}
		if (b.s !== true && b.w !== true && b.a !== true && b.d !== true) moving = false;
		// if (e.repeat) return;
		// buttonsPressed = { ...b };
	}}
/>
<svelte:body
	use:handleMouseMove
	on:click={requestPointerLock}
/>
<div class="player-gun {moving ? 'moving' : 'paused'}" />
<!-- <div class="ray" style={cssText} /> -->
<div
	class="player camera"
	id="camera"
	style={cssText}
>
	<slot />
</div>

<style lang="scss">
	.ray {
		position: absolute;
		transform-style: preserve-3d;
		transform: translate3d(0px, 90px, 30px);
		inset: 0;
		width: 200px;
		height: 200px;

		background: red;
	}
	.left {
		left: -50%;
		top: 50%;
	}
	.right {
		right: -50%;
		top: 50%;
	}
	.center {
		top: 50%;
		left: 50%;
	}
	.player-hitbox {
		border: 23px solid red;
	}
	.paused {
		animation-play-state: unset !important;

		&::after {
			animation-play-state: unset !important;
			transform: translateX(-80%);
			transition: transform cubic-bezier(0.77, 0, 0.175, 1) 1000ms;
		}
	}
	.player-gun {
		position: absolute;
		height: 23em;
		width: 19em;

		bottom: 0;
		margin: 0 auto;
		max-width: 19em;
		z-index: 1;
		left: 0;
		right: 0;
		overflow: hidden;

		transform: translate(0px, 0px);
		transition: transform cubic-bezier(0.77, 0, 0.175, 1) 1000ms;
		// inset: 0;
		// position: fixed;
		// animation: walk 0.6s cubic-bezier(0.77, 0, 0.175, 1) backwards;
		// animation-iteration-count: 4;
	}
	.player-gun::after {
		content: "";
		position: absolute;
		width: 500%;
		height: 100%;
		background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/51773/wolf-gun.gif) 0% 0% / cover
			repeat-x;
		transition: inherit;
		transform: translateX(-80%);
		transition-delay: 0s;
		animation-play-state: running;
		// animation: unset;
	}
	.moving {
		animation: walk 1s cubic-bezier(0.77, 0, 0.175, 1) both alternate-reverse;
	}
	@keyframes walk {
		from {
			transform: translate(-1%, 13%);
		}
		50% {
			transform: translate(8%, 0%);
		}
		to {
			transform: translate(-3%, 2%);
		}
	}
	#camera,
	#world {
		position: absolute;
		perspective: var(--perspective);
		inset: 0;
		transform: translateZ(0);
		// transform: translate3d(, -50%, -640px);
		contain: content size layout;
		transform-style: preserve-3d;
		will-change: transform;
	}

	#camera {
		will-change: transform;
		// contain: layout;
	}
</style>
