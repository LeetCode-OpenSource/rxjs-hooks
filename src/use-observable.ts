import { Observable, BehaviorSubject } from 'rxjs'
import { useState, useEffect } from 'react'
import useConstant from 'use-constant'

import { RestrictArray } from './type'

export type InputFactory<State> = (state$: Observable<State>) => Observable<State>
export type InputFactoryWithInputs<State, Inputs> = (
  state$: Observable<State>,
  inputs$: Observable<RestrictArray<Inputs>>,
) => Observable<State>

export function useObservable<State>(inputFactory: InputFactory<State>): State | null
export function useObservable<State>(inputFactory: InputFactory<State>, initialState: State): State
export function useObservable<State, Inputs>(
  inputFactory: InputFactoryWithInputs<State, Inputs>,
  initialState: State,
  inputs: RestrictArray<Inputs>,
): State
export function useObservable<State, Inputs extends ReadonlyArray<any>>(
  inputFactory: InputFactoryWithInputs<State, Inputs>,
  initialState?: State,
  inputs?: RestrictArray<Inputs>,
): State | null {
  const [state, setState] = useState(typeof initialState !== 'undefined' ? initialState : null)

  const state$ = useConstant(() => new BehaviorSubject<State | undefined>(initialState))
  const inputs$ = useConstant(() => new BehaviorSubject<RestrictArray<Inputs> | undefined>(inputs))

  useEffect(() => {
    inputs$.next(inputs)
  }, inputs || [])

  useEffect(() => {
    let output$: BehaviorSubject<State>
    if (inputs) {
      output$ = (inputFactory as (
        state$: Observable<State | undefined>,
        inputs$: Observable<RestrictArray<Inputs> | undefined>,
      ) => Observable<State>)(state$, inputs$) as BehaviorSubject<State>
    } else {
      output$ = ((inputFactory as unknown) as (state$: Observable<State | undefined>) => Observable<State>)(
        state$,
      ) as BehaviorSubject<State>
    }
    const subscription = output$.subscribe((value) => {
      state$.next(value)
      setState(value)
    })
    return () => {
      subscription.unsubscribe()
      inputs$.complete()
      state$.complete()
    }
  }, []) // immutable forever

  return state
}
