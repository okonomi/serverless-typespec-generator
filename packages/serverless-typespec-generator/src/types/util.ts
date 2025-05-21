export type ReplaceByPath<T, PATH, NEW> = PATH extends [
  infer HEAD,
  ...infer TAIL,
]
  ? HEAD extends keyof T
    ? {
        [P in keyof T]: P extends HEAD
          ? TAIL extends []
            ? NEW
            : ReplaceByPath<T[P], TAIL, NEW>
          : T[P]
      }
    : T
  : T
