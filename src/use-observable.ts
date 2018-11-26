import { Observable, BehaviorSubject } from 'rxjs'
import { useState, useEffect, useMemo } from 'react'

export type InputFactory<T, U = undefined> = U extends undefined
  ? (state$: Observable<T>) => Observable<T>
  : (inputs$: Observable<U>, state$: Observable<T>) => Observable<T>

export function useObservable<T>(inputFactory: InputFactory<T>): T | null
export function useObservable<T>(inputFactory: InputFactory<T>, initialState: T): T
export function useObservable<T, U>(inputFactory: InputFactory<T, U>, initialState: T, inputs: U): T

export function useObservable<T, U>(inputFactory: InputFactory<T, U>, initialState?: T, inputs?: U): T | null {
  const stateSubject$ = new BehaviorSubject<T | undefined>(initialState)
  const inputSubject$ = new BehaviorSubject<U | undefined>(inputs)
  const [state, setState] = useState(typeof initialState !== 'undefined' ? initialState : null)
  const [state$] = useState(stateSubject$)
  const [inputs$] = useState(inputSubject$)

  useMemo(() => {
    inputs$.next(inputs)
  }, ((inputs as unknown) as ReadonlyArray<any>) || [])

  useEffect(
    () => {
      let output$: BehaviorSubject<T>
      if (inputs) {
        output$ = (inputFactory as (
          inputs$: Observable<U | undefined>,
          state$: Observable<T | undefined>,
        ) => Observable<T>)(inputs$, state$) as BehaviorSubject<T>
      } else {
        output$ = (inputFactory as (state$: Observable<T | undefined>) => Observable<T>)(state$) as BehaviorSubject<T>
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
    },
    [], // immutable forever
  )

  return state
}
