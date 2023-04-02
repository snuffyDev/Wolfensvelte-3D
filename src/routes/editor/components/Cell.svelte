<script
	context="module"
	lang="ts"
>
	import { writable } from "svelte/store";

	const element_refs = (() => {
		const _ = new Set<{}>();
		const { subscribe, set } = writable<Set<{}>>(_);
		return {
			subscribe,
			add(id: {}) {
				_.add(id);
				set(_);
			},
			has(id: {}) {
				return _.has(id);
			},
			delete(id: {}) {
				_.delete(id);
				set(_);
			},
			clear: () => {
				set(_);
				_.clear();
			}
		};
	})();
	class DragHandler {
		private declare _state: boolean;
		get state(): boolean {
			return this._state;
		}
		set state(value: boolean) {
			this._state = value;
		}
		constructor() {
			this._state = false;
		}
	}
	const is_dragging = new DragHandler();
</script>

<script lang="ts">
	import { isWallFace } from "$lib/utils/validation";
	import { createEventDispatcher, getContext } from "svelte";
	import { objectKeys } from "$lib/utils/object";
	import { ctxKey, type TextureContext } from "../../key";
	import type { MapItem, Texture } from "../../../lib/types/core";
	const identity = {};
	export let data: MapItem = {} as MapItem;
	export let active: boolean = false;

	let isSelected = false;

	const { textures }: TextureContext = getContext(ctxKey);

	const dispatch = createEventDispatcher<{
		selected: { multi: boolean; state: boolean };
		edge: Texture;
	}>();

	const getCellType = (o: typeof data): "model" | "wall" => {
		for (const key of objectKeys(o)) {
			if (key === "model") {
				if (o[key]?.component) return "model";
			} else if (key === "surfaces") {
				if (typeof o.surfaces === "number") return "wall";
			}
		}
		return "wall";
	};

	$: CELL_TYPE = getCellType(data);
</script>

<svelte:window
	on:pointerup={() => {
		if (is_dragging.state && element_refs.has(identity)) {
			dispatch("selected", { multi: true, state: active });
			element_refs.delete(identity);
			if (!$element_refs.size) is_dragging.state = false;
		}
	}}
/>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="cell"
	class:active={$element_refs.has(identity)}
	on:pointerenter={(event) => {
		if (is_dragging.state && event.shiftKey) {
			element_refs.add(identity);
		}
	}}
	on:pointerdown={(event) => {
		if (event.shiftKey) {
			if (!is_dragging.state) {
				element_refs.clear();
			}
			is_dragging.state = true;
			element_refs.add(identity);
		}
	}}
	on:click|stopPropagation={(event) => {
		if (element_refs.has(identity) === false) {
			element_refs.clear();
			element_refs.add(identity);
		}
		dispatch("selected", { multi: false, state: active });
		event.preventDefault();
	}}
>
	{#if CELL_TYPE === "wall"}
		<span
			class="edge "
			style={data.surfaces ? `--img: url(${$textures[data.surfaces].original});` : ""}
			class:active={data.surfaces !== 0}
		/>
	{:else if data.model?.component}
		<span>{data.model.component[0]}</span>
	{/if}
</div>

<style lang="scss">
	.active {
		background-color: #4b4b4b13;
	}
	.cell {
		position: relative;
		inset: 0;
		height: inherit;
		min-height: inherit;
		display: flex;
		pointer-events: all;
	}
	.edge {
		position: absolute;
		z-index: 50;
		contain: strict;
		min-height: 100%;
		pointer-events: all;
		isolation: isolate;
		border: 1px hsla(0, 0%, 100%, 0.72) solid;
		&.active {
			border: none; // border: 1px hsla(0, 0%, 100%, 0.212) solid;
		}
		&::before {
			content: "";
			position: absolute;
			inset: 0;
			z-index: 20;
			border: none !important;
		}
		&.active::after {
			content: "";
			position: absolute;
			inset: 0;
			background-image: var(--img);
			background-size: 100%;
			opacity: 1;
			z-index: 5;
		}
		width: 100%;
		height: 100%;
		&:hover {
			background-color: #ff9d9dc2;
		}
	}
</style>
