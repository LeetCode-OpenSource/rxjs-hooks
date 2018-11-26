import React from 'react'
import { Observable, of, Observer } from 'rxjs'
import { mapTo, delay, withLatestFrom, map } from 'rxjs/operators'
import { create } from 'react-test-renderer'
import * as Sinon from 'sinon'

import { find } from './find'
import { useEventCallback } from '../use-event-callback'

describe('useEventCallback specs', () => {
  function createFixture<T>(
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
    testRenderer.update(fixtureNode)
    const button = find(testRenderer.root, 'button')
    expect(button.props.onClick.name).toBe('eventCallback')
  })

  it('should render value', () => {
    const value = 1
    const Fixture = createFixture(() => of(value))
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([])
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
  })

  it('should trigger handle async callback', () => {
    const timer = Sinon.useFakeTimers()
    const timeToDelay = 200
    const value = 1
    const Fixture = createFixture((event$: Observable<any>) =>
      event$.pipe(
        mapTo(value),
        delay(timeToDelay),
      ),
    )
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    testRenderer.update(fixtureNode)
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
    timer.restore()
  })

  it('should handle the initial value', () => {
    const timer = Sinon.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const Fixture = createFixture(
      (event$: Observable<any>) =>
        event$.pipe(
          mapTo(value),
          delay(timeToDelay),
        ),
      initialValue,
    )
    const fixtureNode = <Fixture />
    const testRenderer = create(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue}`])
    testRenderer.update(fixtureNode)
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value}`])
    timer.restore()
  })

  it('should handle the state changed', () => {
    const timer = Sinon.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const factory = (event$: Observable<React.MouseEvent<HTMLButtonElement>>, state$: Observable<number>) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([_, state]) => {
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
    testRenderer.update(fixtureNode)
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + value}`])
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${initialValue + value * 2}`])
    timer.restore()
  })

  it('should handle the inputs changed', () => {
    const timer = Sinon.useFakeTimers()
    const initialValue = 1000
    const value = 1
    const timeToDelay = 200
    const factory = (
      event$: Observable<React.MouseEvent<HTMLButtonElement>>,
      inputs$: Observable<number[]>,
      _state$: Observable<number>,
    ) =>
      event$.pipe(
        withLatestFrom(inputs$),
        map(([_, [count]]) => {
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
    testRenderer.update(fixtureNode)
    const button = find(testRenderer.root, 'button')
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(fixtureNode)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value + 1}`])
    testRenderer.update(<Fixture count={4} />)
    button.props.onClick()
    timer.tick(timeToDelay)
    testRenderer.update(<Fixture count={4} />)
    expect(find(testRenderer.root, 'h1').children).toEqual([`${value + 4}`])
    timer.restore()
  })

  it('should call teardown logic after unmount', () => {
    const spy = Sinon.spy()
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
    testRenderer.unmount()
    expect(spy.callCount).toBe(1)
  })
})
