export type RestrictArray<T> = T extends any[] ? T : []
export type VoidAsNull<T> = T extends void ? null : T
export type Not<P, T, F> = P extends false ? T : F
