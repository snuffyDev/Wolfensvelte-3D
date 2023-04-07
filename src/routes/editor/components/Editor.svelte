<script lang="ts">
	import type { Position } from "$lib/types/position";
	import { objectEntries } from "$lib/utils/object";
	import { WALL_FACES } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import type { TiledJSON } from "../../../lib/types/tiled";
	import { ctxKey, type TextureContext } from "../../key";
	import Cell from "./Cell.svelte";
	import TexturePreview from "./Editor/TexturePreview.svelte";
	import Level from "../../../lib/components/Level.svelte";
	import type { MapItem, Texture, WallFace, World } from "../../../lib/types/core";
	import { specialObjectIds as specialObjects } from "$lib/utils/engine/objects";

	const { textures }: TextureContext = getContext(ctxKey);

	let TILE_MAP: {
		active: boolean;
		data: MapItem;
	}[][] = [[]];

	$: TILE_MAP = [...Array(64).keys()].map(() =>
		[...Array(64).keys()].map(() => ({
			active: false,
			data: {
				rotation: undefined,
				surfaces: null
			}
		}))
	);
	let metadata: { name: string; data: string } = { name: "", data: "" };
	let selected: (typeof TILE_MAP)[number][number] & Omit<Position, "z"> = {} as any;
	let currentWallTexture: Texture = null;
	let zoom = 1;
	let zoomPosition: Omit<Position, "z"> = { x: 0, y: 0 };

	let showMapDataList = false;
	let showPreview = false;
	let selectedNode: [row: number, col: number] = [0, 0];
	let selectedEdge: [row: number, col: number, dir: WallFace] = [0, 0, "front"];
	let multiSelectNodes: (typeof selectedNode)[] = [];

	function isCardinalDirection(input: unknown): input is WallFace {
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
		const mapped = rendered[metadata.name].map((m: any[]) =>
			m.map((v: any) =>
				Object.fromEntries(
					objectEntries((v as any).data).map(([k, v]) => {
						return [k, v];
					})
				)
			)
		);
		await navigator.clipboard.writeText(JSON.stringify(mapped));
		return mapped;
	};

	let files: FileList;
	let jsonFile: TiledJSON;
	specialObjects;
	const handleJSON = () => {
		const reader = new FileReader();
		const chunk = <T>(data: Array<T>) => {
			const chunks = [];
			for (let r = 0; r < data.length; r += 64) {
				chunks.push(data.slice(r, r + 64));
			}
			return chunks as T[][];
		};

		reader.onloadend = () => {
			const jsonString = reader.result as string;
			jsonFile = JSON.parse(jsonString);
			const chunked = chunk(jsonFile?.layers?.[0]?.data!);
			console.log(jsonFile, chunked);

			for (let x = 0; x < TILE_MAP.length; x++) {
				for (let y = 0; y < TILE_MAP[x].length; y++) {
					let col = TILE_MAP[x][y].data;
					if (specialObjects.includes(+chunked[x][y])) {
						TILE_MAP[x][y].data = {
							...TILE_MAP[x][y].data,
							model: { component: "Object", texture: +chunked[x][y] }
						};
					} else if (+chunked[x][y] !== 99 && +chunked[x][y] !== 103) {
						col.surfaces = +chunked[x][y] === 0 ? null : +chunked[x][y];
						TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data, surfaces: col.surfaces };
					} else {
						TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data, model: { component: "Door" } };
					}
				}
			}
			for (let x = 0; x < TILE_MAP.length; x++) {
				for (let y = 0; y < TILE_MAP[x].length; y++) {
					const topBottom = [
						TILE_MAP[x - 1]?.[y].data.surfaces,
						TILE_MAP[x + 1]?.[y].data.surfaces
					];
					const leftRight = [
						TILE_MAP[x]?.[y - 1]?.data.surfaces,
						TILE_MAP[x]?.[y + 1]?.data.surfaces
					];

					if (+chunked[x][y] !== 99 && +chunked[x][y] !== 103) continue;
					if (specialObjects.includes(+chunked[x][y])) continue;

					TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data, rotation: { x: 0, y: 0, z: 0 } };

					if (topBottom.every((o) => typeof o === "number")) {
						TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data, rotation: { x: 0, y: 0, z: 0 } };
					}
					if (leftRight.every((o) => typeof o === "number")) {
						TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data, rotation: { x: 0, y: 90, z: 0 } };
					}
					TILE_MAP[x][y].data = { ...TILE_MAP[x][y].data };
				}
			}
			TILE_MAP = [...TILE_MAP];

			console.log(TILE_MAP);
		};
		reader.readAsText(files[0], "utf-8");
	};

	$: if (files && files[0]) handleJSON();
	$: rendered = TILE_MAP.map((m) =>
		m.map((v) => Object.fromEntries(Object.entries(v.data).map(([k, v]) => [k, v])))
	);
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
					<!-- svelte-ignore a11y-click-events-have-key-events -->
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
					<button
						on:click={() => {
							const [row, col] = selectedNode;
							let ref = TILE_MAP[row][col].data;
							ref = { ...ref, model: { component: "Guard" } };
							TILE_MAP[row][col].data.model = { component: "Guard" };
							TILE_MAP[row][col].data = { ...ref };
							TILE_MAP = [...TILE_MAP];
						}}>Guard</button
					>
				</div>

				{#each Object.entries( { front: "Front", left: "Left", back: "Back", right: "Right" } ) as [edge, label]}
					<button
						on:click={() => {
							if (isCardinalDirection(edge)) {
								if (!multiSelectNodes.length) {
									const [row, col] = selectedNode;
									for (const side of WALL_FACES) {
										TILE_MAP[row][col].data.surfaces =
											TILE_MAP[row][col].data.surfaces === null ? currentWallTexture : null;
									}
								} else {
									// Loop through the selected tiles again and disable any connected surfaces
									for (const [row, col] of multiSelectNodes) {
										TILE_MAP[row][col].data.surfaces =
											TILE_MAP[row][col].data.surfaces === null ? currentWallTexture : null;
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
								currentWallTexture = TILE_MAP[selectedEdge[0]][selectedEdge[1]].data.surfaces;
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
		// min-height: 1rem;
		// grid-auto-flow: column dense;
		min-height: 16px;
		grid-template-columns: repeat(auto-fill, minmax(16px, 1fr));
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
		padding: 0 1em;
		outline: yellow 1px solid;
		transform-style: flat;
		top: 50%;
		left: 50%;
		transform-origin: top left;
		// flex-direction: column;
		// grid-auto-flow: row dense;
		grid-template-rows: repeat(auto-fill, minmax(16px, 1fr));

		color: #fff;
	}
</style>
