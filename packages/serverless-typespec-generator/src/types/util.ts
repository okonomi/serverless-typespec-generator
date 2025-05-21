export type ReplaceByPath<T, NAME, NEW> = {
  [K in keyof T]: K extends NAME ? NEW : T[K]
}
