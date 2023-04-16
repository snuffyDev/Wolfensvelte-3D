import { objectKeys } from "../object";

export const textureData = () => TEXTURES;

export type TextureEntry = Awaited<ReturnType<typeof textureData>>;

const textureUrls = import.meta.glob("./../../textures/*.png", { as: "url", eager: true });

const TEXTURES = Object.fromEntries(
	Object.entries(textureUrls).map<[number, { name: number; original: string }]>(([k, p]) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const name = parseInt(k.split("/").pop()!.slice(0, -3));

		return [name, { name, original: p }];
	})
) as { [k: number]: { name: number; original: string } };

export const TEXTURE_KEYS = objectKeys<typeof TEXTURES>(TEXTURES).map((k) => +k);
