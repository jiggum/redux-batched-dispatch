// Copied from https://github.com/reduxjs/redux/blob/344d0e2347b3fc2221e626d495f4a12ac95907f0/test/helpers/actionCreators.js

import {
  ADD_TODO,
  DISPATCH_IN_MIDDLE,
  GET_STATE_IN_MIDDLE,
  SUBSCRIBE_IN_MIDDLE,
  UNSUBSCRIBE_IN_MIDDLE,
  THROW_ERROR,
  UNKNOWN_ACTION,
} from './actionTypes'

export function addTodo(text) {
  return { type: ADD_TODO, text }
}

export function dispatchInMiddle(boundDispatchFn) {
  return {
    type: DISPATCH_IN_MIDDLE,
    boundDispatchFn,
  }
}

export function getStateInMiddle(boundGetStateFn) {
  return {
    type: GET_STATE_IN_MIDDLE,
    boundGetStateFn,
  }
}

export function subscribeInMiddle(boundSubscribeFn) {
  return {
    type: SUBSCRIBE_IN_MIDDLE,
    boundSubscribeFn,
  }
}

export function unsubscribeInMiddle(boundUnsubscribeFn) {
  return {
    type: UNSUBSCRIBE_IN_MIDDLE,
    boundUnsubscribeFn,
  }
}

export function throwError() {
  return {
    type: THROW_ERROR,
  }
}

export function unknownAction() {
  return {
    type: UNKNOWN_ACTION,
  }
}

export function unknownActions() {
  return [unknownAction(), unknownAction(), unknownAction()]
}
