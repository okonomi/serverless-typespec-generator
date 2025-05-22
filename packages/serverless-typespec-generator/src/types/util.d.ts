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
          ? TAIL extends []
            ? NEW
            : [T[P]] extends [undefined]
              ? undefined
              : ReplaceByPath<
                  NonNullable<T[P]>,
                  Extract<TAIL, readonly PropertyKey[]>,
                  NEW
                >
          : T[P]
      }
    : T
  : T
