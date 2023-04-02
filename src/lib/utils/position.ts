import type { Position, Position2D } from "$lib/types/position";

/** Basic distance utility */
export const getDistanceFromPoints = (p1: Position | Position2D, p2: Position | Position2D): number => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
};

/**
 * Converts "local" position (ex: a map tile) to a "real" position that can
 * be used for the actual transformations
 */
export function getRealPositionFromLocalPosition({ x, z }: Position | Omit<Position, "y">) {
	return {
		x: x * 100,
		z: z * 100
	};
}

/**
 * Converts a "real" position (ex: translations) to a "local" position that will match
 * the corresponding map tile.
 */
export function getLocalPositionFromRealPosition({ x, z }: Position | Omit<Position, "y">) {
	return {
		x: Math.ceil(x / 100),
		z: Math.ceil((z - 50) / 100)
	};
}