import { Observable, BehaviorSubject, Subject } from 'rxjs'
import { useState, useEffect, useMemo } from 'react'

const PREFIX = '__SUBJECT__'

const propsSubjects: {
  [index: string]: Subject<any>
} = {}

let subjectId = 0

const concatSubjectKey = (id: number) => `${PREFIX}${id}`

export type InputFactory<T, U = undefined> = U extends undefined
  ? () => Observable<T>
  : (props$: Observable<U>) => Observable<T>

export function useObservable<T, U = undefined>(inputFactory: InputFactory<T, U>): T | null
export function useObservable<T, U = undefined>(inputFactory: InputFactory<T, U>, initialState: T): T
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
  const [state, setState] = useState<[T | null, number]>([initialState || null, 0])
  if (inputs) {
    useMemo(
      () => {
        const props$ = propsSubjects[concatSubjectKey(state[1])]
        if (props$) {
          props$.next(inputs)
        }
      },
      inputs as ReadonlyArray<any>,
    )
  }
  useEffect(
    () => {
      const props$ = new BehaviorSubject<U>(inputs as U)
      const input$ = (inputFactory as (...args: any[]) => Observable<T>)(
        typeof inputs !== 'undefined' ? props$ : void 0,
      )
      subjectId++
      const subscription = input$.subscribe((value) => {
        setState([value, subjectId])
      })
      propsSubjects[concatSubjectKey(subjectId)] = props$
      return () => {
        subscription.unsubscribe()
      }
    },
    [0], // immutable forever
  )
  return state[0]
}
