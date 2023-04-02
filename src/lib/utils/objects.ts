import type { MapItem } from "./map";

export const createMapItem = () => {const mapItem = Object.create(null); mapItem.n = ' ';mapItem.w = ' ';mapItem.s = ' ';mapItem.e = ' '; return mapItem as Required<MapItem>}
