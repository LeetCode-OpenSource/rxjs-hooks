# React hooks for RxJS
[![CircleCI](https://circleci.com/gh/LeetCode-OpenSource/rxjs-hooks.svg?style=svg)](https://circleci.com/gh/LeetCode-OpenSource/rxjs-hooks)
[![Coverage Status](https://coveralls.io/repos/github/LeetCode-OpenSource/rxjs-hooks/badge.svg?branch=master)](https://coveralls.io/github/LeetCode-OpenSource/rxjs-hooks?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/LeetCode-OpenSource/rxjs-hooks.svg)](https://greenkeeper.io/)

- [Installation](#installation)
- [Demo](#quick-look)
- [Apis](#apis)
  1. [useObservable](#useobservable)
  2. [useEventCallback](#useeventcallback)
  
## Installation

Using npm:

```
$ npm i --save rxjs-hooks
```

Or yarn:

```
$ yarn add rxjs-hooks
```

## Quick look

- [useObservable - live demo](https://codesandbox.io/s/00x0z72l5n)

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { useObservable } from "rxjs-hooks";
import { interval } from "rxjs";
import { map } from "rxjs/operators";

function App() {
  const value = useObservable(() => interval(500).pipe(map((val) => val * 3)));

  return (
    <div className="App">
      <h1>Incremental number: {value}</h1>
    </div>
  );
}
```

- [useEventCallback - live demo](https://codesandbox.io/s/jpjr31qmw)

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { useEventCallback } from "rxjs-hooks";
import { map } from "rxjs/operators";

function App() {
  const [clickCallback, [description, x, y]] = useEventCallback((event$) =>
    event$.pipe(
      map((event) => [event.target.innerHTML, event.clientX, event.clientY]),
    ),
    ["nothing", 0, 0],
  )

  return (
    <div className="App">
      <h1>click position: {x}, {y}</h1>
      <h1>"{description}" was clicked.</h1>
      <button onClick={clickCallback}>click me</button>
      <button onClick={clickCallback}>click you</button>
      <button onClick={clickCallback}>click him</button>
    </div>
  );
}
```

## Apis

### `useObservable`

```tsx
type RestrictArray<T> = T extends any[] ? T : []
type InputFactory<State, Inputs = undefined> = Inputs extends undefined
  ? (state$: Observable<State>) => Observable<State>
  : (inputs$: Observable<RestrictArray<Inputs>>, state$: Observable<State>) => Observable<State>

declare function useObservable<State>(inputFactory: InputFactory<State>): State | null
declare function useObservable<State>(inputFactory: InputFactory<State>, initialState: State): State
declare function useObservable<State, Inputs>(
  inputFactory: InputFactory<State, Inputs>,
  initialState: State,
  inputs: RestrictArray<Inputs>,
  deps: readonly any[],
): State
```

#### Examples:

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

**With default value:**

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

**Observe props change:**
```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { of } from 'rxjs'
import { map } from 'rxjs/operators'

function App(props: { foo: number }) {
  const value = useObservable((inputs$) => inputs$.pipe(
    map(([val]) => val + 1),
  ), 200, [props.foo])
  return (
    // render three times
    // 200 and 1001 and 2001
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App foo={1000} />, document.querySelector('#app'))
ReactDOM.render(<App foo={2000} />, document.querySelector('#app'))
```

**useObservable with state$**

[live demo](https://codesandbox.io/s/7jwv36w876)

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { interval } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

function App() {
  const value = useObservable((state$) => interval(1000).pipe(
    withLatestFrom(state$),
    map(([_num, state]) => state * state),
  ), 2)
  return (
    // 2
    // 4
    // 16
    // 256
    // ...
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

**Refresh ovbservable on dependency change**

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useObservable } from 'rxjs-hooks'
import { from } from 'rxjs'
import { map, take } from 'rxjs/operators'

function App(props: { foo: number }) {
  const value = useObservable(() => from([1, 2, 3, 4]).pipe(
    map(val => val + props.foo)
  ), 200, [props.foo])
  return (
    // render four times
    // 2, 4, 5, 6
    <h1>{value}</h1>
  )
}

ReactDOM.render(<App foo={1} />, document.querySelector('#app'))
ReactDOM.render(<App foo={2} />, document.querySelector('#app'))
```

### `useEventCallback`

```tsx
type RestrictArray<T> = T extends any[] ? T : []
type VoidAsNull<T> = T extends void ? null : T

type EventCallbackState<EventValue, State, Inputs = void> = [
  (val: EventValue) => void,
  [State extends void ? null : State, BehaviorSubject<State | null>, BehaviorSubject<RestrictArray<Inputs> | null>]
]
type ReturnedState<EventValue, State, Inputs> = [
  EventCallbackState<EventValue, State, Inputs>[0],
  EventCallbackState<EventValue, State, Inputs>[1][0]
]

type EventCallback<EventValue, State, Inputs> = Inputs extends void
  ? (eventSource$: Observable<EventValue>, state$: Observable<State>) => Observable<State>
  : (
      eventSource$: Observable<EventValue>,
      inputs$: Observable<RestrictArray<Inputs>>,
      state$: Observable<State>,
    ) => Observable<State>

declare function useEventCallback<EventValue, State = void>(
  callback: EventCallback<EventValue, State, void>,
): ReturnedState<EventValue, State | null, void>
declare function useEventCallback<EventValue, State = void>(
  callback: EventCallback<EventValue, State, void>,
  initialState: State,
): ReturnedState<EventValue, State, void>
declare function useEventCallback<EventValue, State = void, Inputs = void>(
  callback: EventCallback<EventValue, State, Inputs>,
  initialState: State,
  inputs: RestrictArray<Inputs>,
): ReturnedState<EventValue, State, Inputs>
```

#### Examples:

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useEventCallback } from 'rxjs-hooks'
import { mapTo } from 'rxjs/operators'

function App() {
  const [clickCallback, value] = useEventCallback((event$: Observable<React.SyntheticEvent<HTMLButtonElement>>) =>
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

**With initial value:**

```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { useEventCallback } from 'rxjs-hooks'
import { mapTo } from 'rxjs/operators'

function App() {
  const [clickCallback, value] = useEventCallback((event$: Observable<React.SyntheticEvent<HTMLButtonElement>>) =>
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

**With state$:**

[live demo](https://codesandbox.io/s/m95lz934x)

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { useEventCallback } from "rxjs-hooks";
import { map, withLatestFrom } from "rxjs/operators";

function App() {
  const [clickCallback, [description, x, y, prevDescription]] = useEventCallback(
    (event$, state$) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([event, state]) => [
           event.target.innerHTML,
           event.clientX,
           event.clientY,
          state[0],
        ])
      ),
    ["nothing", 0, 0, "nothing"]
  );

  return (
    <div className="App">
      <h1>
        click position: {x}, {y}
      </h1>
      <h1>"{description}" was clicked.</h1>
      <h1>"{prevDescription}" was clicked previously.</h1>
      <button onClick={clickCallback}>click me</button>
      <button onClick={clickCallback}>click you</button>
      <button onClick={clickCallback}>click him</button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```

**A complex example: useEventCallback with both inputs$ and state$**

[live demo](https://codesandbox.io/s/n1pn02jxym)

```tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useEventCallback } from "rxjs-hooks";
import { map, withLatestFrom, combineLatest } from "rxjs/operators";

import "./styles.css";

function App() {
  const [count, setCount] = useState(0);
  const [clickCallback, [description, x, y, prevDesc]] = useEventCallback(
    (event$, inputs$, state$) =>
      event$.pipe(
        map(event => [event.target.innerHTML, event.clientX, event.clientY]),
        combineLatest(inputs$),
        withLatestFrom(state$),
        map(([eventAndInput, state]) => {
          const [[text, x, y], [count]] = eventAndInput;
          const prevDescription = state[0];
          return [text, x + count, y + count, prevDescription];
        })
      ),
    ["nothing", 0, 0, "nothing"],
    [count]
  );

  return (
    <div className="App">
      <h1>
        click position: {x}, {y}
      </h1>
      <h1>"{description}" was clicked.</h1>
      <h1>"{prevDesc}" was clicked previously.</h1>
      <button onClick={clickCallback}>click me</button>
      <button onClick={clickCallback}>click you</button>
      <button onClick={clickCallback}>click him</button>
      <div>
        <p>
          click buttons above, and then click this `+++` button, the position
          numbers will grow.
        </p>
        <button onClick={() => setCount(count + 1)}>+++</button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```

**Example of combining callback observables coming from separate elements - animation with start/stop button and rate controllable via slider**

[live demo](https://codesandbox.io/s/pprzmxy230)

```tsx
const Animation = ({ frame }) => {
  const frames = "|/-\\|/-\\|".split("");
  return (
    <div>
      <p>{frames[frame % frames.length]}</p>
    </div>
  );
};


const App = () => {
  const defaultRate = 5;

  const [running, setRunning] = useState(false);

  const [onEvent, frame] = useEventCallback(events$ => {
    const running$ = events$.pipe(
      filter(e => e.type === "click"),
      scan(running => !running, running),
      startWith(running),
      tap(setRunning)
    );

    return events$.pipe(
      filter(e => e.type === "change"),
      map(e => parseInt(e.target.value, 10)),
      startWith(defaultRate),
      switchMap(i => timer(200, 1000 / i)),
      withLatestFrom(running$),
      filter(([_, running]) => running),
      scan(frame => frame + 1, 0)
    );
  });

  return (
    <div className="App">
      <button onClick={onEvent}>{running ? "Stop" : "Start"}</button>
      <input
        type="range"
        onChange={onEvent}
        defaultValue={defaultRate}
        min="1"
        max="10"
      ></input>
      <Animation frame={frame} />
    </div>
  );
};
```
