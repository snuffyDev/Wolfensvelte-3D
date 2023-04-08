export const ssr = false;
export const prerender = true;

export const load = async () => {
	const FACES = Object.fromEntries(
		await Promise.all(
			Object.entries(import.meta.glob("$lib/sprites/face/*.BMP", { eager: true, as: "url" })).map(
				async ([k, v]) => [k, await v]
			)
		)
	);
	const FACE_MAP: Record<
		"dead" | "dying" | "beat_up" | "hurt" | "full" | "low_hp" | "near_death",
		string[]
	> = {
		full: [],
		beat_up: [],
		hurt: [],
		low_hp: [],
		dying: [],
		near_death: [],
		dead: []
	};

	const FACE_KEYS = Object.keys(FACE_MAP).reverse() as (keyof typeof FACE_MAP)[];
	const getFaceKey = (key: string) => {
		return FACE_KEYS.filter((k) => key.includes(k))[0];
	};

	Object.keys(FACES)
		.map((key) => {
			const k = key.split("/").pop()?.slice(0, -4).toLowerCase();
			return [
				k as keyof typeof FACE_MAP | `${keyof typeof FACE_MAP}_0${1 | 2}`,
				FACES[key]
			] as const;
		})
		.reduce<typeof FACE_MAP>((acc, cur) => {
			const [key, value] = cur;

			const map_key = getFaceKey(key);
			if (map_key) {
				acc[map_key]!.push(`--img: url(${new URL(value, import.meta.url).toString()});`);

				acc[map_key]!.sort((a, b) => (a as unknown as number) - (b as unknown as number));
			}
			return acc;
		}, FACE_MAP);
	return {
		FACES: FACE_MAP,
		FACE_KEYS
	};
};