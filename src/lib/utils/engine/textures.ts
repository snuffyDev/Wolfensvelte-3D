import type { Texture } from "../../types/core";
import { objectKeys } from "../object";

export const textureData = async () =>
	Object.fromEntries(
		await Promise.all(
			Object.entries(TEXTURES).map(async ([k, v]) => {
				return [
					+k,
					{
						...v,
						original: URL.createObjectURL(await fetch(await v.original).then((r) => r.blob()))
					}
				] as const;
			})
		)
	) as Record<
		NonNullable<Texture>,
		Omit<(typeof TEXTURES)[keyof typeof TEXTURES], "original"> & {
			original: Awaited<Promise<string>>;
		}
	>;

export type TextureEntry = Awaited<ReturnType<typeof textureData>>;

const textureUrls = import.meta.glob("./../../textures/*.png", { as: "url" });

const TEXTURES = Object.fromEntries(
	Object.entries(textureUrls).map<[number, { name: number; original: Promise<string> }]>(
		([k, p]) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const name = parseInt(k.split("/").pop()!.slice(0, -3));

			return [name, { name, original: p() }];
		}
	)
) as { [k: number]: { name: number; original: Promise<string> } };

export const TEXTURE_KEYS = objectKeys<typeof TEXTURES>(TEXTURES);
