import { useEffect, useMemo, useState, SyntheticEvent } from 'react'
import { Observable, BehaviorSubject, Subject, noop } from 'rxjs'

export type VoidAsNull<T> = T extends void ? null : T

export type EventCallbackState<_T, E, U, I = void> = [
  (e: E) => void,
  [U extends void ? null : U, BehaviorSubject<U | null>, BehaviorSubject<I | null>]
]
export type ReturnedState<T, E, U, I> = [EventCallbackState<T, E, U, I>[0], EventCallbackState<T, E, U, I>[1][0]]

export type EventCallback<_T, E, U, I> = I extends void
  ? (eventSource$: Observable<E>, state$: Observable<U>) => Observable<U>
  : (eventSource$: Observable<E>, inputs$: Observable<I>, state$: Observable<U>) => Observable<U>

export function useEventCallback<T, E extends SyntheticEvent<T>, U = void>(
  callback: EventCallback<T, E, U, void>,
): ReturnedState<T, E, U | null, void>
export function useEventCallback<T, E extends SyntheticEvent<T>, U = void>(
  callback: EventCallback<T, E, U, void>,
  initialState: U,
): ReturnedState<T, E, U, void>
export function useEventCallback<T, E extends SyntheticEvent<T>, U = void, I = void>(
  callback: EventCallback<T, E, U, I>,
  initialState: U,
  inputs: I,
): ReturnedState<T, E, U, I>

export function useEventCallback<T, E extends SyntheticEvent<T>, U = void, I = void>(
  callback: EventCallback<T, E, U, I>,
  initialState?: U,
  inputs?: I,
): ReturnedState<T, E, U | null, I> {
  const initialValue = (typeof initialState !== 'undefined' ? initialState : null) as VoidAsNull<U>
  const inputSubject$ = new BehaviorSubject<I | null>(typeof inputs === 'undefined' ? null : inputs)
  const stateSubject$ = new BehaviorSubject<U | null>(initialValue)
  const [state, setState] = useState(initialValue)
  const [returnedCallback, setEventCallback] = useState<(e: E) => void>(noop)
  const [state$] = useState(stateSubject$)
  const [inputs$] = useState(inputSubject$)

  useMemo(() => {
    inputs$.next(inputs!)
  }, ((inputs as unknown) as ReadonlyArray<any>) || [])

  useEffect(
    () => {
      const event$ = new Subject<E>()
      function eventCallback(e: E) {
        return event$.next(e)
      }
      setState(initialValue)
      setEventCallback(() => eventCallback)
      let value$: Observable<U>

      if (!inputs) {
        value$ = (callback as EventCallback<T, E, U, void>)(event$, state$ as Observable<U>)
      } else {
        value$ = (callback as any)(event$, inputs$ as Observable<any>, state$ as Observable<U>)
      }
      const subscription = value$.subscribe((value) => {
        state$.next(value)
        setState(value as VoidAsNull<U>)
      })
      return () => {
        subscription.unsubscribe()
        state$.complete()
        inputs$.complete()
        event$.complete()
      }
    },
    [], // immutable forever
  )

  return [returnedCallback, state]
}
