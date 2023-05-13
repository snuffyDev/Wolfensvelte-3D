import {
	CurrentLevel,
	createExtendedWorld,
	removeConnectedSurfaces
} from "$lib/components/Level.svelte";

export const load = async ({ params, depends }) => {
	depends("map:load");
	// Asynchronously load here to ensure the map is ready to go
	const level = await import(`$lib/utils/map.ts`)
		.then((mod) => mod[params.level])
		.then((level) => {
			const extendedRoom = createExtendedWorld(level);

			removeConnectedSurfaces(extendedRoom);
			return extendedRoom;
		});

	CurrentLevel.set(level);

	return {
		page: params.level,
		level
	};
};
