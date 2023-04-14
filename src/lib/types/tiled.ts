export interface TiledJSON {
	compressionlevel: number;
	height: number;
	infinite: boolean;
	layers: Layer[];
	nextlayerid: number;
	nextobjectid: number;
	orientation: string;
	renderorder: string;
	tiledversion: string;
	tileheight: number;
	tilesets: Tileset[];
	tilewidth: number;
	type: string;
	version: string;
	width: number;
}

interface Layer {
	data?: number[];
	height?: number;
	id: number;
	name: string;
	opacity: number;
	type: string;
	visible: boolean;
	width?: number;
	x: number;
	y: number;
	draworder?: string;
	objects?: Object[];
}

interface Object {
	gid: number;
	height: number;
	id: number;
	name: string;
	properties?: Property[];
	rotation: number;
	type: string;
	visible: boolean;
	width: number;
	x: number;
	y: number;
}

interface Property {
	name: Name;
	type: Type;
	value: Value;
}

type Name = "secret" | "type" | "elevator";

type Type = "bool" | "string";

type Value = boolean | string;

interface Tileset {
	columns: number;
	firstgid: number;
	grid: Grid;
	margin: number;
	name: string;
	objectalignment: string;
	spacing: number;
	tilecount: number;
	tileheight: number;
	tiles: Tile[];
	tilewidth: number;
}

interface Grid {
	height: number;
	orientation: string;
	width: number;
}

interface Tile {
	id: number;
	image: string;
	imageheight: number;
	imagewidth: number;
}
