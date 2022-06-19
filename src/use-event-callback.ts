import { useEffect, useCallback, useMemo } from 'react'
import useConstant from 'use-constant'
import { Observable, BehaviorSubject, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { RestrictArray, VoidAsNull, Not } from './type'

export type VoidableEventCallback<EventValue> = EventValue extends void ? () => void : (e: EventValue) => void

export type EventCallbackState<EventValue, State, Inputs = void> = [
  VoidableEventCallback<EventValue>,
  [State extends void ? null : State, BehaviorSubject<State | null>, BehaviorSubject<RestrictArray<Inputs> | null>],
]
export type ReturnedState<EventValue, State, Inputs> = [
  EventCallbackState<EventValue, State, Inputs>[0],
  EventCallbackState<EventValue, State, Inputs>[1][0],
]

export type EventCallback<EventValue, State, Inputs> = Not<
  Inputs extends void ? true : false,
  (
    eventSource$: Observable<EventValue>,
    state$: Observable<State>,
    inputs$: Observable<RestrictArray<Inputs>>,
  ) => Observable<State>,
  (eventSource$: Observable<EventValue>, state$: Observable<State>) => Observable<State>
>

export function useEventCallback<EventValue>(
  callback: EventCallback<EventValue, void, void>,
): ReturnedState<EventValue, void | null, void>
export function useEventCallback<EventValue, State>(
  callback: EventCallback<EventValue, State, void>,
  initialState: State,
): ReturnedState<EventValue, State, void>
export function useEventCallback<EventValue, State, Inputs>(
  callback: EventCallback<EventValue, State, Inputs>,
  initialState: State,
  inputs: RestrictArray<Inputs>,
): ReturnedState<EventValue, State, Inputs>

export function useEventCallback<EventValue, State = void, Inputs = void>(
  callback: EventCallback<EventValue, State, Inputs>,
  initialState?: State,
  inputs?: RestrictArray<Inputs>,
): ReturnedState<EventValue, State | null, Inputs> {
  const initialValue = (typeof initialState !== 'undefined' ? initialState : null) as VoidAsNull<State>
  const event$ = useConstant(() => new Subject<EventValue>())
  const state$ = useConstant(() => new BehaviorSubject<State | null>(initialValue))
  const inputs$ = useConstant(
    () => new BehaviorSubject<RestrictArray<Inputs> | null>(typeof inputs === 'undefined' ? null : inputs),
  )

  useEffect(() => {
    return () => {
      state$.complete()
      inputs$.complete()
      event$.complete()
    }
  }, [])

  const returnedCallback = useCallback(function eventCallback(e: EventValue) {
    event$.next(e)
  }, [])

  useEffect(() => {
    inputs$.next(inputs!)
  }, inputs || [])

  const subscribe = useMemo(() => {
    let value$: Observable<State>
    if (!inputs) {
      value$ = (callback as EventCallback<EventValue, State, void>)(event$, state$ as Observable<State>)
    } else {
      value$ = (callback as any)(event$, state$ as Observable<State>, inputs$ as Observable<Inputs>)
    }
    return (onStorageChange: () => void) => {
      const subscription = value$.pipe(tap((s) => state$.next(s))).subscribe(onStorageChange)
      return () => subscription.unsubscribe()
    }
  }, [])

  const getSnapShot = useMemo(() => {
    return () => state$.getValue() as VoidAsNull<State>
  }, [])

  const state = useSyncExternalStore(subscribe, getSnapShot, getSnapShot)

  return [returnedCallback as VoidableEventCallback<EventValue>, state]
}
