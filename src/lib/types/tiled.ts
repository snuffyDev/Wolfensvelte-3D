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
	height: number;
	id: number;
	name: string;
	opacity?: number;
	type: string;
	visible: boolean;
	width: number;
	x: number;
	y: number;
	rotation?: number;
}

interface Tileset {
	columns: number;
	firstgid: number;
	image: string;
	imageheight: number;
	imagewidth: number;
	margin: number;
	name: string;
	spacing: number;
	tilecount: number;
	tileheight: number;
	tiles: Tile[];
	tilewidth: number;
}

interface Tile {
	id: number;
	objectgroup: Objectgroup;
}

interface Objectgroup {
	draworder: string;
	id: number;
	name: string;
	objects: Layer[];
	opacity: number;
	type: string;
	visible: boolean;
	x: number;
	y: number;
}
