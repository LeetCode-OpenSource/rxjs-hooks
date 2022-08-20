import React from 'react'
import { Observable, of, Observer } from 'rxjs'
import { map, delay, withLatestFrom, combineLatestWith } from 'rxjs/operators'
import { create, act } from 'react-test-renderer'
import { describe, it, expect, vi } from 'vitest'

import { find } from './find'
import { useEventCallback } from '../use-event-callback'

describe('useEventCallback specs', () => {
  function createFixture<T extends React.ReactNode>(
    factory: (event$: Observable<React.SyntheticEvent<any>>) => Observable<T>,
    initialValue?: T,
  ) {
    return function Fixture() {
      const [callback, value] = useEventCallback(factory, initialValue)
      return (
        <>
          <h1>{value}</h1>
          <button onClick={callback}>click me</button>
        </>
      )
    }
  }

  it('should generate callback', () => {
    const Fixture = createFixture(() => of(1))
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    act(() => testRenderer.update(fixtureNode))
    const button = find(testRenderer.root, 'button')
    expect(button.props.onClick.name).toBe('eventCallback')
  })

  it('should render value', () => {
    const value = 1
    const Fixture = createFixture(() => of(value))
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
  })

  it('should trigger handle async callback', () => {
    const timer = vi.useFakeTimers()
    const timeToDelay = 200
    const value = 1
    const Fixture = createFixture((event$: Observable<any>) =>
      event$.pipe(
        map(() => value),
        delay(timeToDelay),
      ),
    )
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    act(() => testRenderer.update(fixtureNode))
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
    timer.useRealTimers()
  })

  it('should handle the initial value', () => {
    const timer = vi.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const Fixture = createFixture(
      (event$: Observable<any>) =>
        event$.pipe(
          map(() => value),
          delay(timeToDelay),
        ),
      initialValue,
    )
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])
    act(() => testRenderer.update(fixtureNode))
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
    timer.useRealTimers()
  })

  it('should handle the state changed', () => {
    const timer = vi.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const factory = (event$: Observable<React.MouseEvent<HTMLButtonElement>>, state$: Observable<number>) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([, state]) => {
          return state + value
        }),
        delay(timeToDelay),
      )
    function Fixture() {
      const [clickCallback, stateValue] = useEventCallback(factory, initialValue)

      return (
        <>
          <h1>{stateValue}</h1>
          <button onClick={clickCallback}>click me</button>
        </>
      )
    }
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])
    act(() => testRenderer.update(fixtureNode))
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + value}`])
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + value * 2}`])
    timer.useRealTimers()
  })

  it('should handle the inputs changed', () => {
    const timer = vi.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const factory = (
      event$: Observable<React.MouseEvent<HTMLButtonElement>>,
      _state$: Observable<number>,
      inputs$: Observable<number[]>,
    ): Observable<number> =>
      event$.pipe(
        combineLatestWith(inputs$),
        map(([, [count]]) => {
          return value + count
        }),
        delay(timeToDelay),
      )
    function Fixture(props: { count: number }) {
      const [clickCallback, stateValue] = useEventCallback(factory, initialValue, [props.count])

      return (
        <>
          <h1>{stateValue}</h1>
          <button onClick={clickCallback}>click me</button>
        </>
      )
    }
    const fixtureNode = <Fixture count={1} />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])
    act(() => testRenderer.update(fixtureNode))
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(fixtureNode))
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value + 1}`])
    act(() => testRenderer.update(<Fixture count={4} />))
    button.props.onClick()
    timer.advanceTimersByTime(timeToDelay)
    act(() => testRenderer.update(<Fixture count={4} />))
    timer.advanceTimersByTime(timeToDelay)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value + 4}`])
    timer.useRealTimers()
  })

  it('should call teardown logic after unmount', () => {
    const spy = vi.fn()
    const Fixture = createFixture(
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
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    act(() => {
      testRenderer.unmount()
    })
    expect(spy).toHaveBeenCalledOnce()
  })
})
