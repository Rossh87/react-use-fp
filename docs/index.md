---
layout: default
title: Home
permalink: /
nav_order: 1
---
# Getting started

## Installation
Add package to your React project

```
npm install react-use-fp
```
or, if you're using Yarn,
```
yarn add react-use-fp
```
---

## Setup your state
Define a reducer, and type its actions

```
import { Reducer } from 'react';

interface SetCountAction {
	type: 'SET_COUNT';
	payload: number;
}

interface ErrorAction {
	type: 'COUNT_COMPONENT_ERR'
	payload: Error
}

interface ComponentState {
	count: number;
	error: null | Error
}

export type CountActions = ErrorAction | SetCountAction

const initialState: ComponentState = {
	count: 0,
	error: null
};

export const componentReducer: Reducer<ComponentState, SetCountAction> = (
	state,
	action
) => {
	switch (action.type) {
		case 'SET_COUNT':
			return { count: action.payload };
		case 'COUNT_COMPONENT_ERR':
			return {...state, error: action.payload}
		default:
			return state;
	}
};
```
---
## Write an action handler
Define a handler that can interact with component state via  dispatch.  It should be of type
`Reader<{dispatch: Dispatch}, any>`.  For more details about this pattern, see [the About section]({% link about/index.md %}).
```
import {FPReader} from 'react-use-fp'
import {CountActions} from './reducer'
import {tryCatch, map, mapLeft} from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'

// Notice we destructure the first parameter to access dispatch
const getNewCount: FPReader<CountActions> = ({ dispatch }) =>
	pipe(
		tryCatch(
			() =>
				fetch('www.countapi.com').then(
					(res) => res.json() as Promise<{ count: number }>
				),
			(e) =>
				new Error(
					'HTTP request for new count from remote server failed'
				)
		),
		map(({ count }) => dispatch({ type: 'SET_COUNT', payload: count })),
		mapLeft((e) => dispatch({ type: 'COUNT_COMPONENT_ERR', payload: e }))
	);
```

---
## Call the hook
Pass the `FPReader` we just defined to `useFPReducer` in a plain object.  Then pass the initial state and reducer, just like vanilla `useReducer`.
```
import {getNewCount} from './handlers'
import {useFPReducer} from 'react-use-fp'

const CountDisplay: React.FunctionComponent<any> = (props) => {
	const [state, dispatch, actions] = useFPReducer({
		GET_COUNT: getNewCount,
	})(
		initialState,
		countReducer
	)

	const onClick = (e: any) => dispatch(actions.GET_COUNT());

	return <h1 onClick={onClick}>The current count is {state.count}</h1>;
};
```
And that's it!  You've got a typesafe, asynchronous control flow for your component that's cleanly separated from any rendering logic.