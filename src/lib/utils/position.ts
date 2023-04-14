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
		x: Math.round(x * 64),
		z: Math.round(z * 64)
	};
}

/**
 * Converts a "real" position (ex: translations) to a "local" position that will match
 * the corresponding map tile.
 */
export function getLocalPositionFromRealPosition({ x, z }: Position | Omit<Position, "y">) {
	return {
		x: (Math.ceil(x / 64) + (x >> 31)) ^ (x >> 31),
		z: (Math.ceil((z - 32) / 64) + (z >> 31)) ^ (z >> 31)
	};
}
/** Utility for getting the direction the player is currently facing */
export function getFacingDirection(angle: number): "front" | "right" | "back" | "left" {
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