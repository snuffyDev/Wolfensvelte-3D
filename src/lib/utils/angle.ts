import { PlayerState, type IPlayerState } from "$lib/stores/player";
import type { Position, Position2D } from "../types/position";

export function normalizeAngle(angle: number): number {
	angle = angle < 0 ? 360 + angle : angle;
	const range = 360;
	return ((angle % range) + range) % range;
}

export function getAngleBetweenPoints(pos1: Position | Position2D, pos2: Position | Position2D) {
	const dx = pos1.x - pos2.x;
	const dz = pos2.z - pos1.z;

	const angle = normalizeAngle((Math.atan2(dz, dx) * 180) / Math.PI);

	return angle;
}

export function isVisibleToPlayer<
	T extends { getPosition: () => Position | Position2D } | Position2D
>(playerState: IPlayerState, obj: T, fov = 30) {
	let position: Position2D;

	if ("getPosition" in obj) {
		position = obj.getPosition();
	} else {
		position = obj;
	}

	const angleBetween = getAngleBetweenPoints(playerState.position, position);

	const playerViewAngle = normalizeAngle(-playerState.rotation.y - 90);
	const left = normalizeAngle(playerViewAngle - fov / 2);
	const right = normalizeAngle(playerViewAngle + fov / 2);

	return isAngleBetween(angleBetween, left, right);
}

export function isAngleBetween(mid: number, start: number, end: number): boolean {
	const formattedEnd = end - start < 0 ? end - start + 360 : end - start;
	const formattedMid = mid - start < 0 ? mid - start + 360 : mid - start;

	return formattedMid > formattedEnd;
}
