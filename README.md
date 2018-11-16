# React hooks for RxJS
[![CircleCI](https://circleci.com/gh/LeetCode-OpenSource/rxjs-hooks.svg?style=svg)](https://circleci.com/gh/LeetCode-OpenSource/rxjs-hooks)
[![Coverage Status](https://coveralls.io/repos/github/LeetCode-OpenSource/rxjs-hooks/badge.svg?branch=master)](https://coveralls.io/github/LeetCode-OpenSource/rxjs-hooks?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/LeetCode-OpenSource/rxjs-hooks.svg)](https://greenkeeper.io/)

## useObservable

```tsx
declare function useObservable<T>(sourceFactory: () => Observable<T>): T | null

declare function useObservable<T>(sourceFactory: () => Observable<T>, initialState: T): T

declare function useObservable<T, U>(sourceFactory: (props$: Observable<U>) => Observable<T>, initialState: T, inputs: U): T
```

### Examples:

#### Simple:
```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { of } from 'rxjs'

function App() {
  const value = useObservable(() => of(1000))
  return (
    // render twice
    // null and 1000
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
```

#### With default value:
```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { of } from 'rxjs'

function App() {
  const value = useObservable(() => of(1000), 200)
  return (
    // render twice
    // 200 and 1000
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
```

#### Observe props change:
```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { of } from 'rxjs'
import { map } from 'rxjs/operators'

function App(props: { foo: number }) {
  const value = useObservable((props$) => props$.pipe(
    map(([val]) => val + 1),
  ), 200, [props.foo])
  return (
    // render three times
    // 200 and 10001 and 2001
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App foo={1000} />, document.querySelector('#app'))
ReactDOM.render(<App foo={2000} />, document.querySelector('#app'))
```

## useEventCallback

```tsx
declare type EventCallbackState<T, U> = [
  ((e: SyntheticEvent<T>) => void) | typeof noop,
  U
]
declare type EventCallback<T, U> = (
  eventSource$: Observable<SyntheticEvent<T>>
) => Observable<U>

declare function useEventCallback<T, U = void>(
  callback: EventCallback<T, U>
): EventCallbackState<T, U | null>
declare function useEventCallback<T, U = void>(
  callback: EventCallback<T, U>,
  initialState: U
): EventCallbackState<T, U>
```

### Examples:

#### Simple:

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useEventCallback } from 'rxjs-hooks'
import { mapTo } from 'rxjs/operators'

function App() {
  const [clickCallback, value] = useEventCallback((event$: Observable<React.React.SyntheticEvent<HTMLButtonElement>>) =>
    event$.pipe(
      mapTo(1000)
    )
  )
  return (
    // render null
    // click button
    // render 1000
    <>
      <h1>{value}</h1>
      <button onClick={clickCallback}>click me</button>
    </>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
```

#### With initial value:

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useEventCallback } from 'rxjs-hooks'
import { mapTo } from 'rxjs/operators'

function App() {
  const [clickCallback, value] = useEventCallback((event$: Observable<React.React.SyntheticEvent<HTMLButtonElement>>) =>
    event$.pipe(
      mapTo(1000)
    ),
    200,
  )
  return (
    // render 200
    // click button
    // render 1000
    <>
      <h1>{value}</h1>
      <button onClick={clickCallback}>click me</button>
    </>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
```
