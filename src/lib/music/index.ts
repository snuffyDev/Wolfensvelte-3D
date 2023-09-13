export const Soundtrack = Object.fromEntries(
	Object.entries({
		"Wondering About My Loved Ones": "./Wondering About My Loved Ones.ogg",
		menu: "./menu.mp3",
		E1M1: "./Get Them Before They Get You.mp3",
		E1M2: "./Searching For The Enemy.ogg",
		E1M3: "./Prisoner of War.ogg",
		E1M4: "./Suspense.ogg",
		E1M5: "./Get Them Before They Get You.mp3",
		E1M6: "./Searching For The Enemy.ogg",
		E1M7: "./Prisoner of War.ogg",
		E1M8: "./Suspense.ogg",
		E1M9: "./March to War.ogg",
		E1M10: "./Enemy Around the Corner.ogg"
	} as const).map(([key, value]) => [key, new URL(value, import.meta.url).href])
);
