import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { interval, Observable, timer } from 'rxjs'
import { exhaustMap, mapTo, scan, switchMap } from 'rxjs/operators'

import { useObservable } from '../src/use-observable'
import { useEventCallback } from '../src/use-event-callback'

const mockBackendRequest = (event$: Observable<React.SyntheticEvent<HTMLHeadElement>>) =>
  event$.pipe(
    exhaustMap(() => timer(1000).pipe(mapTo(100))),
    scan((acc, cur) => acc + cur, 0),
  )

function IntervalValue(props: { interval: number }) {
  const [clickCallback, value] = useEventCallback<HTMLHeadingElement, number>(mockBackendRequest, 0)
  const intervalValue = useObservable(
    (props$) =>
      props$.pipe(
        switchMap(([intervalTime]) => interval(intervalTime)),
        scan((acc) => acc + 1, 0),
      ),
    0,
    [props.interval],
  )
  return (
    <h1 onClick={clickCallback}>
      value:
      {value + intervalValue}
    </h1>
  )
}

function App() {
  const [intervalTime, setIntervalTime] = useState(1000)
  const setTime = (intervalTime: number) => () => setIntervalTime(intervalTime)
  return (
    <>
      <IntervalValue interval={intervalTime} />
      <button onClick={setTime(1000)}>1000</button>
      <button onClick={setTime(200)}>200</button>
    </>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
