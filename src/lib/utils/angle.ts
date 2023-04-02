// TODO: move some functions from Level.svelte to here

import type { Position, Position2D } from "../types/position";

export function normalizeAngle(angle: number): number {
	const range = 360;

	return ((angle % range) + range) % range;
}

export function getAngleBetween(pos1: Position | Position2D, pos2: Position | Position2D) {
	const dx = pos1.x - pos2.x;
	const dz = pos2.z - pos1.z;

	const angle = normalizeAngle((Math.atan2(dz, dx) * 180) / Math.PI);

	return angle;
}

export function isAngleBetween(mid: number, start: number, end: number): boolean {
	const formattedEnd = end - start < 0 ? end - start + 360 : end - start;
	const formattedMid = mid - start < 0 ? mid - start + 360 : mid - start;

	return formattedMid > formattedEnd;
}
