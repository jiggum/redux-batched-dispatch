# redux-batched-dispatch

Redux store enhancer to allow batched dispatch.

[![npm](https://img.shields.io/npm/v/redux-batched-dispatch.svg)](https://www.npmjs.com/package/redux-batched-dispatch)
[![Build Status](https://api.travis-ci.org/jiggum/redux-batched-dispatch.svg?branch=master)](https://travis-ci.org/jiggum/redux-batched-dispatch)
[![min](https://img.shields.io/bundlephobia/min/redux-batched-dispatch.svg)](https://www.npmjs.com/package/redux-batched-dispatch)
[![minzip](https://img.shields.io/bundlephobia/minzip/redux-batched-dispatch.svg)](https://www.npmjs.com/package/redux-batched-dispatch)

## Installation

yarn:
```bash
yarn add redux-batched-dispatch
```

npm:
```bash
npm install --save redux-batched-dispatch
```

## Usage

### Batch Action

```js
import reduxBatchedDispatch  from 'redux-batched-dispatch';
import { createStore } from 'redux';

const store = createStore(reducer, reduxBatchedDispatch());

// Batched dispatch will notify to listeners only once after store updated
store.dispatch([
  { type: 'Hello' },
  { type: 'World' },
]);
```

### Rate Limited Dispatch

```js
import reduxBatchedDispatch  from 'redux-batched-dispatch';
import { createStore } from 'redux';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';

function reducer(state = [], action) {
  switch (action.type) {
    case 'PUSH':
      return [...state, action.value];
    default:
      return state;
  }
}

function push(value) {
  return {
    type: 'PUSH',
    value,
  };
}

const store = createStore(
  reducer,
  reduxBatchedDispatch({
    // Invoke `dispatch`, but not more than once every 100ms.
    'DISPATCH_THROTTLE': dispatch => throttle(dispatch, 100, { leading: false }),
    // Invoke `dispatch`, debouncing 100ms
    'DISPATCH_DEBOUNCE': dispatch => debounce(dispatch, 100),
  }),
);

store.subscribe(() => {
  console.log(store.getState());
});

setTimeout(() => { store.dispatch(push('T1'), 'DISPATCH_THROTTLE') }, 0);
setTimeout(() => { store.dispatch(push('T2'), 'DISPATCH_THROTTLE') }, 20);
setTimeout(() => { store.dispatch(push('T3'), 'DISPATCH_THROTTLE') }, 40);
setTimeout(() => { store.dispatch(push('T4'), 'DISPATCH_THROTTLE') }, 260);
setTimeout(() => { store.dispatch(push('D1'), 'DISPATCH_DEBOUNCE') }, 0);
setTimeout(() => { store.dispatch(push('D2'), 'DISPATCH_DEBOUNCE') }, 70);
setTimeout(() => { store.dispatch(push('D3'), 'DISPATCH_DEBOUNCE') }, 140);
setTimeout(() => { store.dispatch(push('D4'), 'DISPATCH_DEBOUNCE') }, 300);
  
// stdout1:100ms => ['T1', 'T2', 'T3']
// stdout2:240ms => ['T1', 'T2', 'T3', 'D1', 'D2', 'D3']
// stdout3:360ms => ['T1', 'T2', 'T3', 'D1', 'D2', 'D3', 'T4']
// stdout4:400ms => ['T1', 'T2', 'T3', 'D1', 'D2', 'D3', 'T4', 'D4']
```

### With Middlewares

You can use extra middlewares like [redux-thunk](https://github.com/reduxjs/redux-thunk), [redux-saga](https://github.com/redux-saga/redux-saga), [redux-observable](https://github.com/redux-observable/redux-observable), etc..

```js
import reduxBatchedDispatch  from 'redux-batched-dispatch';
import { createStore, applyMiddleware } from 'redux';

const store = createStore(
  reducer,
  reduxBatchedDispatch(
    applyMiddleware(exampleMiddleware),
    {
      'DISPATCH_DEBOUNCE': dispatch => debounce(dispatch, 100),
    },
  )
);
```

## Module Usage

### ES6 module

```js
import reduxBatchedDispatch from 'redux-batched-dispatch';
```

### CommonJS

```js
const reduxBatchedDispatch = require('redux-batched-dispatch');
```

### Browser

Add below `<script>` tag to the HTML page right before the closing `</body>` tag
```html
<script src="https://unpkg.com/redux-batched-dispatch@0.3/dist/index.js" crossorigin></script>
```
And use global `reduxBatchedDispatch` variable
