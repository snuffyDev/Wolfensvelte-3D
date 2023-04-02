export const objectEntries = <T extends object>(o: T) => Object.entries(o ?? {}) as [keyof T, T[keyof T]][]
export const objectKeys = <T extends object>(o: T) => Object.keys(o) as (keyof T)[]