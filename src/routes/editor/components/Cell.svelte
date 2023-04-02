<script context="module" lang="ts">
	import { writable } from 'svelte/store';

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
	import type { CardinalDirection, MapItem, Texture } from '$lib/utils/map';
	import { isCardinalDirection } from '$lib/utils/validation';
	import { createEventDispatcher } from 'svelte';
	import type { CellImpl } from './Editor/EditorImpl';
	import { objectKeys } from '$lib/utils/object';
	const identity = {};
	export let data: Omit<MapItem, 'surfaces'> & {
		surfaces: {
			[D in CardinalDirection]: { active: boolean; key: Texture; dir: CardinalDirection };
		};
	} = {} as any;
	export let active: boolean = false;

	let isSelected = false;
	const dispatch = createEventDispatcher<{
		selected: { multi: boolean; state: boolean };
		edge: { active: boolean; key: Texture; dir: CardinalDirection };
	}>();

	const clickHandler = (dir: CardinalDirection & string) => {
		delete data.model;
		let edge = data.surfaces[dir];
		edge = { ...edge, active: !edge.active };
		data = { ...data, surfaces: { ...data.surfaces, [dir]: { ...edge } } };
		dispatch('edge', {
			active: edge.active,
			key: edge.key === ' ' ? '#' : edge.key,
			dir: dir as CardinalDirection
		});
	};

	const getCellType = (o: typeof data): 'model' | 'wall' => {
		let types: ('model' | 'wall')[] = [];

		for (const key of objectKeys(o)) {
			if (key === 'model') {
				if (o[key]?.component) return 'model';
			} else if (key === 'surfaces') {
				for (const k of objectKeys(o['surfaces'])) {
					if (o['surfaces'][k].active) return 'wall';
				}
			}
		}
		return 'wall';
	};

	$: CELL_TYPE = getCellType(data);
	// $: console.log(data, data);
</script>

<svelte:window
	on:pointerup={() => {
		if (is_dragging.state && element_refs.has(identity)) {
			dispatch('selected', { multi: true, state: active });
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
		// console.log(event, data);
		if (element_refs.has(identity) === false) {
			element_refs.clear();
			element_refs.add(identity);
		}
		dispatch('selected', { multi: false, state: active });
		event.preventDefault();
	}}
>
	{#if CELL_TYPE === 'wall'}
		{#each Object.entries(data.surfaces) as [dir, { active, key }], i}
			<div
				class="{['back', 'front'].includes(dir) ? 'h' : 'v'} edge {dir}"
				class:active
				on:contextmenu|preventDefault={() => {
					if (isCardinalDirection(dir)) {
						data.surfaces[dir].active = false;
					}
				}}
				on:click|stopPropagation={() => {
					if (isCardinalDirection(dir)) {
						// console.log(dir, { active, key });
						if (!active) {
							data.surfaces[dir].active = true;
						}
						clickHandler(dir);
					}
				}}
				on:dblclick={(e) => {}}
			/>
		{/each}
	{:else}
		<span>D</span>
	{/if}
</div>

<style lang="scss">
	.active {
		background-color: #ffffff27;
	}
	.cell {
		position: relative;
		width: 1rem;
		height: 1rem;
		contain: strict;
		pointer-events: all;
	}
	.edge {
		position: absolute;
		z-index: 50;
		background-color: hsla(0, 0%, 100%, 0.7);
		contain: strict;
		pointer-events: all;

		&.active {
			background-color: rgb(231, 19, 19) !important;
		}
		&.v {
			// outline: #ffffff8d 0.1px solid;
			height: 100%;
			width: 1px;
			position: absolute;
			&::before {
				position: absolute;
				height: 100%;
				width: 1px;
				padding: 3px;
				// inset: 0;
				content: '';
				// padding-inline: 4px;
				// padding-inline: 1%;
				// padding-inline: 4px;
			}
		}
		&.h {
			width: 100%;
			height: 1px;
			position: absolute;
			// inset: 0;
			&::before {
				content: '';
				width: 100%;
				height: 1px;
				padding: 3px;
				// padding-block: 1%;
				position: absolute;
			}
		}
		&:hover {
			background-color: #ff9d9dc2;
		} // padding-block: 0.1px;
	}
	.front {
		top: 0px;
	}
	.back {
		bottom: 0px;
	}
	.left {
		left: 0;
	}
	.right {
		right: 0;
	}
</style>
