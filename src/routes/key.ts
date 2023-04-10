import type { textureData } from "$lib/utils/engine/textures";
import type { Writable } from "svelte/store";

export const ctxKey = {};
export type TextureContext = {
	textures: Writable<Awaited<ReturnType<typeof textureData>>>;
};
