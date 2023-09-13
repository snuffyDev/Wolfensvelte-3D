import type { ExtendedEntityV2 } from "$lib/types/core/map";
import type { Position2D } from "$lib/types/position";

type Portal = {
	position: Position2D;
	connectedRegion: number;
};

type Region = {
	portals: Portal[];
	connectedRegions: number[];
	tiles: Position2D[];
};
function* preprocessLevel(level: ExtendedEntityV2[][]): Generator<Region, void, undefined> {
	const regions: Region[] = [];
	const visitedTiles: Set<string> = new Set();

	function findConnectedRegion(position: Position2D, regionIndex: number): void {
		const { x, z } = position;
		const key = `${x},${z}`;

		const region: Region = {
			portals: [],
			connectedRegions: [],
			tiles: [position]
		};

		const stack: Position2D[] = [position];

		while (stack.length > 0) {
			const tile = stack.pop();
			if (!tile) {
				continue;
			}

			const { x, z } = tile;

			const adjacentTiles: Position2D[] = [
				{ x: x - 1, z }, // left
				{ x: x + 1, z }, // right
				{ x, z: z - 1 }, // front
				{ x, z: z + 1 } // back
			];

			for (const adjacentTile of adjacentTiles) {
				const { x: adjX, z: adjZ } = adjacentTile;

				if (adjX >= 0 && adjX < level.length && adjZ >= 0 && adjZ < level[adjX].length) {
					const adjacentTileData = level[adjZ][adjX];

					if (visitedTiles.has(`${adjX},${adjZ}`)) {
						continue;
					}
					if (
						adjacentTileData.pushwall ||
						(adjacentTileData.component === "Door" &&
							adjacentTileData.attributes?.state === "closed")
					) {
						const connectedRegion = regionIndex;
						region.portals.push({
							position: adjacentTile,
							connectedRegion
						});

						region.connectedRegions.push(connectedRegion);
					} else if (adjacentTileData.blocking && adjacentTileData.component === "Object") {
						stack.push(adjacentTile);

						visitedTiles.add(`${adjX},${adjZ}`);
						region.tiles.push(adjacentTile);
					} else if (!adjacentTileData.blocking && !visitedTiles.has(`${adjX},${adjZ}`)) {
						visitedTiles.add(`${adjX},${adjZ}`);
						stack.push(adjacentTile);
						region.tiles.push(adjacentTile);
					} else if (
						adjacentTileData &&
						adjacentTileData.component !== "Door" &&
						!adjacentTileData.pushwall
					) {
						if (!visitedTiles.has(`${adjX},${adjZ}`) && !adjacentTileData.blocking) {
							visitedTiles.add(`${adjX},${adjZ}`);
							stack.push(adjacentTile);
							region.tiles.push(adjacentTile);
							continue;
						}
						// visitedTiles.add(`${adjX},${adjZ}`);
						region.tiles.push(adjacentTile);
					}
				}
			}
		}

		regions[regionIndex] = region;
	}

	for (let x = 0; x < level.length; x++) {
		for (let z = 0; z < level[x].length; z++) {
			const tile = level[z][x];

			if ((!visitedTiles.has(`${x},${z}`) && !tile.blocking) || tile.pushwall) {
				const regionIndex = regions.length;
				findConnectedRegion({ x, z }, regionIndex);
			}
		}
	}

	yield* regions;
}

function getCurrentRegion(regions: Region[], position: Position2D): Region | undefined {
	for (const region of regions) {
		if (region.tiles.some((tile) => tile.x === position.x && tile.z === position.z)) {
			return region;
		}
	}
	return undefined;
}

function getAdjacentRegions(regions: Region[], region: Region): Region[] {
	const adjacentRegions: Region[] = [];

	for (const connectedRegion of region.connectedRegions) {
		const adjacentRegion = regions[connectedRegion];
		if (adjacentRegion) {
			adjacentRegions.push(adjacentRegion);
		}
	}

	return adjacentRegions;
}

function isPositionPortal(regions: Region[], position: Position2D): boolean {
	for (const region of regions) {
		for (const portal of region.portals) {
			if (portal.position.x === position.x && portal.position.z === position.z) {
				return true;
			}
		}
	}
	return false;
}

function getVisiblePortals(
	viewerPosition: Position2D,
	viewerRotation: number,
	regions: Region[],
	fov: number
): Portal[] {
	const visiblePortals: Portal[] = [];

	for (const region of regions) {
		for (const portal of region.portals) {
			const { position } = portal;
			if (isPositionVisible(viewerPosition, viewerRotation, position, fov)) {
				visiblePortals.push(portal);
			}
		}
	}

	return visiblePortals;
}

function isPositionVisible(
	viewerPosition: Position2D,
	viewerRotation: number,
	position: Position2D,
	fov: number
): boolean {
	const viewerToPosition = {
		x: position.x - viewerPosition.x,
		z: position.z - viewerPosition.z
	};

	const angleToPosition = Math.atan2(viewerToPosition.z, viewerToPosition.x);
	const angleDifference = normalizeAngle(viewerRotation - angleToPosition);

	return Math.abs(angleDifference) <= fov / 2;
}

function normalizeAngle(angle: number): number {
	return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

export {
	type Region,
	preprocessLevel,
	getCurrentRegion,
	getAdjacentRegions,
	isPositionPortal,
	getVisiblePortals
};
