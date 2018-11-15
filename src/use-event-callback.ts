import { useEffect, useState, SyntheticEvent } from 'react'
import { Observable, Subject, noop } from 'rxjs'

export type EventCallbackState<T, U> = [((e: SyntheticEvent<T>) => void) | typeof noop, U]

export type EventCallback<T, U> = (eventSource$: Observable<SyntheticEvent<T>>) => Observable<U>

export function useEventCallback<T, U = void>(callback: EventCallback<T, U>): EventCallbackState<T, U | null>
export function useEventCallback<T, U = void>(callback: EventCallback<T, U>, initialState: U): EventCallbackState<T, U>

export function useEventCallback<T, U = void>(
  callback: EventCallback<T, U>,
  initialState?: U,
): EventCallbackState<T, U | null> {
  const initialValue = typeof initialState !== 'undefined' ? initialState : null
  const [state, setState] = useState<EventCallbackState<T, U | null>>([noop, initialValue])
  useEffect(
    () => {
      const event$ = new Subject<SyntheticEvent<T>>()
      const clickCallback = (e: SyntheticEvent<T>) => event$.next(e)
      setState([clickCallback, initialValue])
      const value$ = callback(event$)
      const subscription = value$.subscribe((value) => {
        setState([clickCallback, value])
      })
      return () => subscription.unsubscribe()
    },
    [0], // immutable forever
  )

  return state
}
