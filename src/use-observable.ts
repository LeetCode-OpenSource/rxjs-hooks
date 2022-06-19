import { Observable, BehaviorSubject } from 'rxjs'
import { tap } from 'rxjs/operators'
import { useEffect, useMemo } from 'react'
import useConstant from 'use-constant'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

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
  const state$ = useConstant(() => new BehaviorSubject<State | undefined>(initialState))
  const inputs$ = useConstant(() => new BehaviorSubject<RestrictArray<Inputs> | undefined>(inputs))

  useEffect(() => {
    return () => {
      state$.complete()
      inputs$.complete()
    }
  }, [])

  useEffect(() => {
    inputs$.next(inputs)
  }, inputs || [])

  const subscribe = useMemo(() => {
    let output$: Observable<State>
    if (inputs) {
      output$ = (
        inputFactory as (
          state$: Observable<State | undefined>,
          inputs$: Observable<RestrictArray<Inputs> | undefined>,
        ) => Observable<State>
      )(state$, inputs$)
    } else {
      output$ = (inputFactory as unknown as (state$: Observable<State | undefined>) => Observable<State>)(state$)
    }
    return (onStorageChange: () => void) => {
      const subscription = output$.pipe(tap((s) => state$.next(s))).subscribe(onStorageChange)
      return () => subscription.unsubscribe()
    }
  }, [])

  const getSnapShot = useMemo(() => {
    return () => state$.getValue() ?? null
  }, [])

  return useSyncExternalStore(subscribe, getSnapShot, getSnapShot)
}
