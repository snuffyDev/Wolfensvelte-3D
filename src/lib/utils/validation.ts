import type { Texture, WallFace } from "../types/core";
import { TEXTURE_KEYS } from "./engine/textures";

export function isValidTexture(src: unknown): src is Texture {
	return (
		typeof src === "number" &&
		TEXTURE_KEYS.includes(+src as unknown as (typeof TEXTURE_KEYS)[number])
	);
}

export const WALL_FACES: ReadonlyArray<WallFace> = ["front", "left", "right", "back"] as const;

export function isWallFace(input: unknown): input is WallFace {
	return typeof input === "string" && WALL_FACES.includes(input as WallFace);
}

export const ArrayUtils = {
	includesUnknown<T extends ReadonlyArray<unknown>>(array: T, searchElement: unknown) {
		return array.includes(searchElement);
	}
};
