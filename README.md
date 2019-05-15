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

### Standard

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

### With middlewares

You can use extra middlewares like [redux-thunk](https://github.com/reduxjs/redux-thunk), [redux-saga](https://github.com/redux-saga/redux-saga), [redux-observable](https://github.com/redux-observable/redux-observable), etc..

```js
import reduxBatchedDispatch  from 'redux-batched-dispatch';
import { createStore, applyMiddleware } from 'redux';

const store = createStore(
  reducer,
  reduxBatchedDispatch(applyMiddleware(exampleMiddleware))
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
