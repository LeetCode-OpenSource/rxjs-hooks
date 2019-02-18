import React from 'react'
import { create, act } from 'react-test-renderer'
import * as Sinon from 'sinon'
import { of, Observable, Observer, Subject } from 'rxjs'

import { find } from './find'
import { useObservable } from '../use-observable'
import { tap, withLatestFrom, map } from 'rxjs/operators'

describe('useObservable specs', () => {
  let fakeTimer: Sinon.SinonFakeTimers

  beforeEach(() => {
    fakeTimer = Sinon.useFakeTimers()
  })

  afterEach(() => {
    fakeTimer.restore()
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
    const spy = Sinon.spy()
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
    expect(spy.callCount).toBe(0)
    testRenderer.unmount()
    expect(spy.callCount).toBe(1)
  })

  it('should emit changed states in observableFactory', () => {
    const spy = Sinon.spy()
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
    expect(spy.callCount).toBe(0)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    act(() => testRenderer.update(<Fixture />))
    source$.next(initialValue)
    expect(spy.callCount).toBe(1)
    expect(spy.args[0]).toEqual([initialValue])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])

    act(() => testRenderer.update(<Fixture />))
    const secondValue = 2000
    source$.next(secondValue)
    expect(spy.callCount).toBe(2)
    expect(spy.args[1]).toEqual([initialValue + secondValue])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + secondValue}`])
  })

  it('should emit changed props in observableFactory', () => {
    const timer = Sinon.useFakeTimers()
    const spy = Sinon.spy()
    const timeToDelay = 200
    function Fixture(props: { foo: number; bar: string; baz: any }) {
      const value = useObservable((inputs$: Observable<[number, any] | null>) => inputs$.pipe(tap(spy)), null, [
        props.foo,
        props.baz,
      ] as any)
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
    expect(spy.callCount).toBe(0)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    expect(find(testRenderer.root, 'div').children).toEqual([])
    const newProps = { ...props, bar: 'new bar' }
    act(() => testRenderer.update(<Fixture {...newProps} />))
    // wait useEffect fired
    // https://reactjs.org/docs/hooks-reference.html#timing-of-effects
    timer.tick(timeToDelay)
    expect(spy.callCount).toBe(1)
    expect(spy.args[0]).toEqual([[newProps.foo, newProps.baz]])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${newProps.foo}`])
    expect(find(testRenderer.root, 'div').children).toEqual([`${newProps.baz.foo}`])

    const renewProps = { ...props, foo: 1000 }
    act(() => testRenderer.update(<Fixture {...renewProps} />))
    timer.tick(timeToDelay)

    expect(spy.callCount).toBe(2)
    expect(spy.args[1]).toEqual([[renewProps.foo, renewProps.baz]])
    expect(find(testRenderer.root, 'h1').children).toEqual([`${renewProps.foo}`])
    expect(find(testRenderer.root, 'div').children).toEqual([`${renewProps.baz.foo}`])
  })
})
