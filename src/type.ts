export type RestrictArray<T> = T extends any[] ? T : []
export type VoidAsNull<T> = T extends void ? null : T
