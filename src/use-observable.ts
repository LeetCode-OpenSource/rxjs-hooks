import { Observable, BehaviorSubject } from 'rxjs'
import { useState, useEffect, useMemo } from 'react'

export type InputFactory<T, U = undefined> = U extends undefined
  ? () => Observable<T>
  : (props$: Observable<U>) => Observable<T>

export function useObservable<T>(inputFactory: InputFactory<T>): T | null
export function useObservable<T>(inputFactory: InputFactory<T>, initialState: T): T
export function useObservable<T, U extends ReadonlyArray<any>>(
  inputFactory: InputFactory<T, U>,
  initialState: T,
  inputs: U,
): T

export function useObservable<T, U extends ReadonlyArray<any> | undefined>(
  inputFactory: InputFactory<T, U>,
  initialState?: T,
  inputs?: U,
): T | null {
  const [inputs$] = useState(new BehaviorSubject<U | undefined>(inputs))
  const [state, setState] = useState(typeof initialState !== 'undefined' ? initialState : null)

  useEffect(
    () => {
      const output$ = (inputFactory as (inputs$?: Observable<U | undefined>) => Observable<T>)(
        typeof inputs !== 'undefined' ? inputs$ : void 0,
      )
      const subscription = output$.subscribe((value) => setState(value))
      return () => subscription.unsubscribe()
    },
    [], // immutable forever
  )

  useMemo(
    () => {
      inputs$.next(inputs)
    },
    (inputs || []) as ReadonlyArray<any>,
  )

  return state
}
