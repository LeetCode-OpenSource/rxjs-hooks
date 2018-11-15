# React hooks for RxJS

## useObservable

```ts
declare function useObservable<T>(sourceFactory: () => Observable<T>): T | null

declare function useObservable<T>(sourceFactory: () => Observable<T>, initialState: T): T

declare function useObservable<T, U>(sourceFactory: (props$: Observable<U>) => Observable<T>, initialState: T, inputs: U): T
```

## useEventCallback

```ts
declare type EventCallbackState<T, U> = [
  ((e: SyntheticEvent<T>) => void) | typeof noop,
  U
]
declare type EventCallback<T, U> = (
  eventSource$: Observable<SyntheticEvent<T>>
) => Observable<U>

declare function useEventCallback<T, U = void>(
  callback: EventCallback<T, U>
): EventCallbackState<T, U | null>
declare function useEventCallback<T, U = void>(
  callback: EventCallback<T, U>,
  initialState: U
): EventCallbackState<T, U>
```