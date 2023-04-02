import type { textureData } from "$lib/utils/map"
import type { Writable } from "svelte/store"

export const ctxKey = {}
export type TextureContext = {textures: Writable<Awaited<ReturnType<typeof textureData>>>}