export type MenuKey = "New Game" | "Sound" | "Quit";

export const MAIN_MENU_ITEMS: [key: MenuKey, action: { action: () => void | Promise<void> }][] = [
	["New Game"]
];
