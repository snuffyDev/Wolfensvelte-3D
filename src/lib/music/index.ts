export const Soundtrack = Object.fromEntries(
	Object.entries({
		"Wondering About My Loved Ones": new URL(
			"./Wondering About My Loved Ones.ogg",
			import.meta.url
		).toString(),
		menu: new URL("./menu.mp3", import.meta.url).toString(),
		E1M1: new URL("./Get Them Before They Get You.mp3", import.meta.url).toString(),
		E1M2: new URL("./Searching For The Enemy.ogg", import.meta.url).toString(),
		E1M3: new URL("./Prisoner of War.ogg", import.meta.url).toString(),
		E1M4: new URL("./Suspense.ogg", import.meta.url).toString(),
		E1M5: new URL("./Get Them Before They Get You.mp3", import.meta.url).toString(),
		E1M6: new URL("./Searching for the Enemy.ogg", import.meta.url).toString(),
		E1M7: new URL("./Prisoner of War.ogg", import.meta.url).toString(),
		E1M8: new URL("./Suspense.ogg", import.meta.url).toString(),
		E1M9: new URL("./March To War.ogg", import.meta.url).toString(),
		E1M10: new URL("./Enemy Around the Corner.ogg", import.meta.url).toString()
	} as const).map(([key, value]) => [key, new URL(value, import.meta.url).href])
);
