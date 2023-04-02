import { TEXTURE_KEYS, type CardinalDirection, type Texture } from "./map";

export function isValidTexture(src: unknown): src is Texture {
    return typeof src === 'string' && TEXTURE_KEYS.includes(src as unknown as (typeof TEXTURE_KEYS)[number]);
}

export const CARDINAL_DIRECTION: ReadonlyArray<CardinalDirection> = ['front','left','right','back'] as const;
export function isCardinalDirection(input: unknown): input is CardinalDirection {
    return typeof input === 'string' && CARDINAL_DIRECTION.includes(input as CardinalDirection);
}
