<script lang="ts">
	import Door from "$lib/components/Door.svelte";
	import type { Position } from "$lib/types/position";
	import type { CardinalDirection, Entity, MapItem, Model, Texture, World } from "$lib/utils/map";
	import { objectEntries } from "$lib/utils/object";
	import { createMapItem } from "$lib/utils/objects";
	import { CARDINAL_DIRECTION, isValidTexture } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import { derived } from "svelte/store";
	import { ctxKey, type TextureContext } from "../../key";
	import Cell from "./Cell.svelte";
	import { CellImpl, EditorImpl } from "./Editor/EditorImpl";
	import TexturePreview from "./Editor/TexturePreview.svelte";
	import Level from "./Level.svelte";

	const { textures }: TextureContext = getContext(ctxKey);

	let TILE_MAP: {
		active: boolean;
		data: Omit<MapItem, "surfaces"> & {
			surfaces: {
				[D in CardinalDirection]: { active: boolean; key: Texture; dir: CardinalDirection };
			};
		};
	}[][] = [[]];

	$: TILE_MAP = [...Array(64).keys()].map(() =>
		[...Array(64).keys()].map(() => ({
			active: false,
			data: {
				rotation: undefined,
				surfaces: Object.fromEntries(
					["front", "left", "back", "right"].map((k) => [
						k as CardinalDirection,
						{ active: false, key: {} as any, dir: k as CardinalDirection }
					])
				) as any
			}
		}))
	);
	let metadata: { name: string; data: string } = { name: "", data: "" };
	let selected: (typeof TILE_MAP)[number][number] & Omit<Position, "z"> = {} as any;
	let currentWallTexture: Texture = "#";
	let zoom = 1;
	let zoomPosition: Omit<Position, "z"> = { x: 0, y: 0 };

	let showMapDataList = false;
	let showPreview = false;
	let selectedNode: [row: number, col: number] = [0, 0];
	let selectedEdge: [row: number, col: number, dir: CardinalDirection] = [0, 0, "front"];
	let multiSelectNodes: (typeof selectedNode)[] = [];
	// $: console.log({ selected });
	// $: console.log({ selectedEdge });
	// $: console.log({ TILE_MAP });
	function isCardinalDirection(input: unknown): input is CardinalDirection {
		return typeof input === "string" && ["front", "left", "back", "right"].includes(input);
	}

	let maps: Record<string, World> = {};

	const loadMaps = () => {
		try {
			maps = JSON.parse(localStorage.getItem("maps")!);
		} catch {
			maps = {};
		}
		return Object.assign({}, maps);
	};
	const handleRender = async () => {
		const maps = loadMaps();
		const data = Object.assign(maps, {
			[metadata.name]: TILE_MAP.map((rows) =>
				rows.map((col) => {
					return col;
				})
			)
		});
		return data;
	};
	const handleSave = async () => {
		const data = await handleRender();

		queueMicrotask(() => {
			localStorage.setItem("maps", JSON.stringify(data));
		});
		showPreview = !showPreview;
		return Promise.resolve(true);
	};

	const handleLoad = (name: string) => {
		const maps = loadMaps();
		TILE_MAP = (maps[name] as unknown as typeof TILE_MAP) ?? [];
		showMapDataList = !showMapDataList;
	};

	const handleShowMaps = () => {
		const maps = loadMaps();
		showMapDataList = !showMapDataList;
	};

	const handleCopy = async () => {
		const rendered = await handleRender();
		const mapped = rendered[metadata.name].map((m) =>
			m.map((v) =>
				Object.fromEntries(
					objectEntries((v as any).data).map(([k, v]) => {
						if (k === "surfaces")
							return [
								k,
								Object.fromEntries(
									objectEntries(v as unknown as Partial<Record<CardinalDirection, Texture>>).map(
										([k, v]) => [k, (v! as any).key]
									)
								)
							];
						return [k, v];
					})
				)
			)
		);
		await navigator.clipboard.writeText(JSON.stringify(mapped));
		return mapped;
	};

	let files: FileList;
	let jsonFile;
	const handleJSON = () => {
		const reader = new FileReader();
		reader.onloadend = () => {
			jsonFile = reader.result;
			console.log(JSON.parse(jsonFile));
		};
		reader.readAsText(files[0], "utf-8");
	};
	$: console.log(showMapDataList);
	$: if (files && files[0]) handleJSON();
	$: rendered = TILE_MAP.map((m) =>
		m.map((v) =>
			Object.fromEntries(
				Object.entries(v.data).map(([k, v]) =>
					k === "surfaces"
						? [k, Object.fromEntries(Object.entries(v ?? {}).map(([k1, v1]) => [k1, v1.key]))]
						: [k, v]
				)
			)
		)
	);

	$: {
		rendered && (async () => console.log(await handleCopy()))();
	}

	const getOppositeEdge = (edge: CardinalDirection): CardinalDirection => {
		const directions: Record<CardinalDirection, CardinalDirection> = {
			back: "front",
			left: "right",
			front: "back",
			right: "left"
		};
		return directions[edge];
	};

	// Define a function to perform DFS on the tile map
	function disableConnectedSurfaces(row: number, col: number, dir: CardinalDirection) {
		// Get the current tile
		const currentTile = TILE_MAP[row][col];

		// Get the adjacent tile in the specified direction
		const adjacentTile =
			dir === "front"
				? TILE_MAP[row - 1][col]
				: dir === "left"
				? TILE_MAP[row][col - 1]
				: dir === "back"
				? TILE_MAP[row + 1][col]
				: TILE_MAP[row][col + 1];

		// If the adjacent tile has an active surface in the opposite direction,
		// disable it and recursively disable its connected surfaces
		if (adjacentTile?.data.surfaces[getOppositeDirection(dir)].active) {
			adjacentTile.data.surfaces[getOppositeDirection(dir)].active = false;
			adjacentTile.data.surfaces[getOppositeDirection(dir)].key = undefined;
			disableConnectedSurfaces(
				dir === "front" ? row - 1 : dir === "left" ? row : dir === "back" ? row + 1 : row,
				dir === "front" ? col : dir === "left" ? col - 1 : dir === "back" ? col : col + 1,
				dir
			);
		}
	}

	// Define a function to get the opposite direction
	function getOppositeDirection(dir: CardinalDirection): CardinalDirection {
		return dir === "front" ? "back" : dir === "left" ? "right" : dir === "back" ? "front" : "left";
	}
</script>

<main
	style={showPreview ? "display: contents;" : ""}
	on:wheel|preventDefault|capture={(e) => {
		if (e.ctrlKey || e.shiftKey) {
			zoomPosition.x += e.deltaX + -zoom * -0.025;
			zoomPosition.y += e.deltaY + -zoom * -0.025;
			e.preventDefault();
		} else {
			zoom += e.deltaY * -0.0125;
			zoom = Math.min(Math.max(1, zoom), 8);

			zoomPosition.x += e.deltaX + -zoom * -0.025;
			zoomPosition.y += e.deltaY + -zoom * -0.025;
		}
	}}
>
	<header
		style="color: #fefefe; top: 0; z-index: 10000;
	width: 100%; background-color: #212121; position:relative;"
	>
		<label for=""
			>Map Name: <input
				type="text"
				bind:value={metadata.name}
			/></label
		>
		<button
			on:click={() => {
				TILE_MAP = [...TILE_MAP];

				showPreview = !showPreview;
			}}>{!showPreview ? "Preview" : "Back to editor"}</button
		>
		<button on:click={handleSave}>{"Save to browser"}</button>
		<button on:click={handleShowMaps}>{"Load Map Data"}</button>
		<button on:click={handleCopy}>{"Copy to clipboard"}</button>
		<label for=""
			><input
				bind:files
				type="file"
			/>{"Load Tiled JSON"}</label
		>
	</header>
	{#if showMapDataList}
		<aside>
			<ul>
				{#each Object.keys(maps) as key}
					<li on:click={() => handleLoad(key)}>{key}</li>
				{/each}
			</ul>
		</aside>
	{/if}
	{#if showPreview}
		<Level
			mode={showPreview ? "play" : "generating"}
			level={rendered}
		/>
	{:else}
		{#if selected}
			<div class="panel">
				<div class="info container">
					<p><b>Cell</b></p>
					<p>Row: {selected.y} | Col: {selected.x}</p>
					<p><b>Edge</b></p>
					{#key selectedEdge}
						<TexturePreview bind:selected={currentWallTexture} />
					{/key}
					<button
						on:click={() => {
							const [row, col] = selectedNode;
							let ref = TILE_MAP[row][col].data;
							ref = { ...ref, model: { component: "Door" } };
							TILE_MAP[row][col].data.model = { component: "Door" };
							TILE_MAP[row][col].data = { ...ref };
							TILE_MAP = [...TILE_MAP];
						}}>Door</button
					>
				</div>

				{#each Object.entries( { front: "Front", left: "Left", back: "Back", right: "Right" } ) as [edge, label]}
					<button
						on:click={() => {
							if (isCardinalDirection(edge)) {
								if (!multiSelectNodes.length) {
									const [row, col] = selectedNode;
									for (const side of CARDINAL_DIRECTION) {
										TILE_MAP[row][col].data.surfaces[side].active =
											!TILE_MAP[row][col].data.surfaces[side].active;
										TILE_MAP[row][col].data.surfaces[side].key = TILE_MAP[row][col].data.surfaces[
											side
										].active
											? currentWallTexture
											: undefined;
									}
								} else {
									// Loop through the selected tiles again and disable any connected surfaces
									for (const [row, col] of multiSelectNodes) {
										for (const side of CARDINAL_DIRECTION) {
											TILE_MAP[row][col].data.surfaces[side].active =
												!TILE_MAP[row][col].data.surfaces[side].active;
											TILE_MAP[row][col].data.surfaces[side].key = TILE_MAP[row][col].data.surfaces[
												side
											].active
												? currentWallTexture
												: undefined;
										}
									}
									// for (const [row, col] of multiSelectNodes) {
									// 	for (const side of CARDINAL_DIRECTION) {
									// 		if (TILE_MAP[row- 1][col].data.surfaces[getOppositeDirection(side)].active) {
									// 			TILE_MAP[row][col].data.surfaces[side].active = false;
									// 			TILE_MAP[row][col].data.surfaces[side].key = undefined;
									// 		}
									// 		if (TILE_MAP[row][col + 1].data.surfaces[getOppositeDirection(side)].active) {
									// 			TILE_MAP[row][col].data.surfaces[side].active = false;
									// 			TILE_MAP[row][col].data.surfaces[side].key = undefined;

									// 		}
									// 	}
									// }
								}
								TILE_MAP = [...TILE_MAP];
							}
						}}>{label}</button
					>
				{/each}
			</div>
		{/if}
		<div
			class="editor"
			style="transform: scale({zoom}) translate3d(calc({zoomPosition.x}px), calc({zoomPosition.y}px), 0px);"
		>
			{#each TILE_MAP as row, rowIdx}
				<div class="row">
					{#each row as col, colIdx}
						<Cell
							bind:data={col.data}
							active={col.active}
							on:selected={({ detail }) => {
								if (!detail.multi) {
									multiSelectNodes = [];
									selected = Object.assign(col, { x: colIdx, y: rowIdx });
									col = { ...selected };
									selectedNode = [rowIdx, colIdx];
									TILE_MAP[rowIdx][colIdx] = { ...col };
								} else {
									multiSelectNodes = [...multiSelectNodes, [rowIdx, colIdx]];
								}
								console.log(detail, selected);
							}}
							on:edge={({ detail }) => {
								currentWallTexture =
									TILE_MAP[selectedEdge[0]][selectedEdge[1]].data.surfaces[selectedEdge[2]].key;
							}}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</main>

<style lang="scss">
	main {
		display: grid;
		grid-template-rows: 2em 1fr;
		position: fixed;
		inset: 0;
		background-color: #010102;
		will-change: contents;
		contain: strict;
	}
	.row {
		contain: content;

		display: inline-grid;
		width: 100%;
		// grid-
		align-content: center;

		grid-template-columns: repeat(auto-fill, minmax(18px, 1fr));
	}
	button {
		min-height: 2rem;
	}
	.panel {
		display: grid;
		position: absolute;
		bottom: 0;
		right: 0;
		min-width: 15rem;
		min-height: 15rem;
		padding: 1em 1.5em;
		background: #2f2f2f92;
		color: #f3f3f3;
		backdrop-filter: blur(8px) brightness(1) opacity(0.9);
		z-index: 100;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
			Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
	}
	aside {
		max-width: 22em;
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		z-index: 1000;
		min-height: 100vh;
		padding: 1em 1.5em;
		background: #121212;
		// background-blend-mode: luminosity;
		color: #f3f3f3;
		// mix-blend-mode: multiply;
		// ?		mix-blend-mode: multiply;
		backdrop-filter: blur(2px) brightness(0.1) opacity(1);
	}
	.editor {
		min-width: 100%;
		will-change: transform scroll-position;
		min-height: 100vh;
		display: grid;
		contain: content;
		padding: 0 1em;
		outline: yellow 1px solid;
		transform-style: flat;
		top: 50%;
		left: 50%;
		transform-origin: top left;
		grid-template-rows: repeat(auto-fill, minmax(18px, 1fr));
		color: #fff;
	}
</style>
