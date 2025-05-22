export type Replace<T, PROP, NEW> = PROP extends keyof T
  ? {
      [P in keyof T]: P extends PROP ? NEW : T[P]
    }
  : T

export type ReplaceByPath<
  T,
  PATH extends readonly PropertyKey[],
  NEW,
> = PATH extends [infer HEAD, ...infer TAIL]
  ? HEAD extends keyof T
    ? {
        [P in keyof T]: P extends HEAD
          ? TAIL extends readonly PropertyKey[]
            ? TAIL extends readonly []
              ? NEW
              : ReplaceByPath<T[P], TAIL, NEW>
            : never
          : T[P]
      }
    : T
  : T
