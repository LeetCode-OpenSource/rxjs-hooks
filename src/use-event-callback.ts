import { useEffect, useState, useCallback } from 'react'
import { Observable, BehaviorSubject, Subject } from 'rxjs'

import { RestrictArray, VoidAsNull, Not } from './type'

export type EventCallbackState<EventValue, State, Inputs = void> = [
  (e: EventValue) => void,
  [State extends void ? null : State, BehaviorSubject<State | null>, BehaviorSubject<RestrictArray<Inputs> | null>]
]
export type ReturnedState<EventValue, State, Inputs> = [
  EventCallbackState<EventValue, State, Inputs>[0],
  EventCallbackState<EventValue, State, Inputs>[1][0]
]

export type EventCallback<EventValue, State, Inputs> = Not<
  Inputs extends void ? true : false,
  (
    eventSource$: Observable<EventValue>,
    inputs$: Observable<RestrictArray<Inputs>>,
    state$: Observable<State>,
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
  const inputSubject$ = new BehaviorSubject<RestrictArray<Inputs> | null>(typeof inputs === 'undefined' ? null : inputs)
  const stateSubject$ = new BehaviorSubject<State | null>(initialValue)
  const [state, setState] = useState(initialValue)
  const [event$] = useState(new Subject<EventValue>())
  function eventCallback(e: EventValue) {
    return event$.next(e)
  }
  const returnedCallback = useCallback(eventCallback, [])
  const [state$] = useState(stateSubject$)
  const [inputs$] = useState(inputSubject$)

  useEffect(() => {
    inputs$.next(inputs!)
  }, inputs || [])

  useEffect(() => {
    setState(initialValue)
    let value$: Observable<State>

    if (!inputs) {
      value$ = (callback as EventCallback<EventValue, State, void>)(event$, state$ as Observable<State>)
    } else {
      value$ = (callback as any)(event$, inputs$ as Observable<Inputs>, state$ as Observable<State>)
    }
    const subscription = value$.subscribe((value) => {
      state$.next(value)
      setState(value as VoidAsNull<State>)
    })
    return () => {
      subscription.unsubscribe()
      state$.complete()
      inputs$.complete()
      event$.complete()
    }
  }, []) // immutable forever

  return [returnedCallback, state]
}
