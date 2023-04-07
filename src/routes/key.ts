import type { objectData } from "$lib/utils/engine/objects";
import type { textureData } from "$lib/utils/engine/textures";
import type { Writable } from "svelte/store";

export const ctxKey = {};
export type TextureContext = {
	textures: Writable<Awaited<ReturnType<typeof textureData>>>;
	objects: Writable<Awaited<ReturnType<typeof objectData>>>;
};
