import React from 'react'
import { create, act } from 'react-test-renderer'
import { of, Observable, Observer, Subject } from 'rxjs'

import { find } from './find'
import { useObservable } from '../use-observable'
import { tap, withLatestFrom, map } from 'rxjs/operators'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useObservable specs', () => {

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should get value from sync Observable', () => {
    const value = 100
    function Fixture() {
      const value = useObservable(() => of(100))
      return <h1>{value}</h1>
    }
    const fixtureNode = <Fixture />

    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    act(() => testRenderer.update(fixtureNode))

    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
  })

  it('should render the initialValue', () => {
    const initialValue = 2000
    const value = 100
    function Fixture() {
      const value = useObservable(() => of(100), initialValue)
      return <h1>{value}</h1>
    }
    const fixtureNode = <Fixture />

    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])
    act(() => testRenderer.update(fixtureNode))

    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
  })

  it('should call teardown logic after unmount', () => {
    const spy = vi.fn()
    function Fixture() {
      const value = useObservable(
        () =>
          new Observable((observer: Observer<number>) => {
            const timerId = setTimeout(() => {
              observer.next(1)
              observer.complete()
            }, 1000)
            return () => {
              spy()
              clearTimeout(timerId)
            }
          }),
      )
      return <h1>{value}</h1>
    }
    const fixtureNode = <Fixture />

    const testRenderer = create(fixtureNode)
    expect(spy).toHaveBeenCalledTimes(0)
    act(() => {
      testRenderer.unmount()
    })
    expect(spy).toHaveBeenCalledOnce()
  })

  it('should emit changed states in observableFactory', () => {
    const spy = vi.fn()
    const initialValue = 1000
    const source$ = new Subject<number>()
    function Fixture() {
      const value = useObservable((state$: Observable<number>) =>
        source$.pipe(
          withLatestFrom(state$),
          map(([intervalValue, state]) => {
            if (state) {
              return intervalValue + state
            }
            return intervalValue
          }),
          tap(spy),
        ),
      )
      return (
        <>
          <h1>{value}</h1>
        </>
      )
    }

    const testRenderer = create(<Fixture />)
    expect(spy).toHaveBeenCalledTimes(0)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    act(() => testRenderer.update(<Fixture />))
    source$.next(initialValue)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(initialValue)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])

    act(() => testRenderer.update(<Fixture />))
    const secondValue = 2000
    source$.next(secondValue)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(initialValue + secondValue)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + secondValue}`])
  })

  it('should emit changed props in observableFactory', () => {
    const spy = vi.fn()
    const timeToDelay = 200
    function Fixture(props: { foo: number; bar: string; baz: any }) {
      const value = useObservable(
        (_: Observable<number | null>, inputs$: Observable<[number, any] | null>) => inputs$.pipe(tap(spy)),
        null,
        [props.foo, props.baz] as any,
      )
      return (
        <>
          <h1>{value && value[0]}</h1>
          <div>{value && value[1].foo}</div>
        </>
      )
    }

    const props = {
      foo: 1,
      bar: 'bar',
      baz: {
        foo: 1,
      },
    }

    const testRenderer = create(<Fixture {...props} />)
    expect(spy).toHaveBeenCalledTimes(0)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    expect(find(testRenderer.root, 'div').children).toEqual([])
    const newProps = { ...props, bar: 'new bar' }
    act(() => testRenderer.update(<Fixture {...newProps} />))
    // wait useEffect fired
    // https://reactjs.org/docs/hooks-reference.html#timing-of-effects
    vi.advanceTimersByTime(timeToDelay)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith([newProps.foo, newProps.baz])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${newProps.foo}`])
    expect(find(testRenderer.root, 'div').children).toEqual([`${newProps.baz.foo}`])

    const renewProps = { ...props, foo: 1000 }
    act(() => testRenderer.update(<Fixture {...renewProps} />))
    vi.advanceTimersByTime(timeToDelay)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith([renewProps.foo, renewProps.baz])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${renewProps.foo}`])
    expect(find(testRenderer.root, 'div').children).toEqual([`${renewProps.baz.foo}`])
  })
})
