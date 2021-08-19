---
layout: home
---
# Getting started

Add package to your React project

```
npm install react-use-fp
```
or, if you're using Yarn,
```
yarn add react-use-fp
```

Create whatever actions/reducers are needed to manage your component's state.

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

3. Define a handler that can dispatch actions.  Handlers must satisfy one of the following types:
```
import {Reader} from 'fp-ts/Reader'
import {Dispatch} from 'react
import {MyActions} from './path/to/action/definitions'
import {HandlerDependencies} from './path/to/typeof/dependencies'

<!-- First acceptable type-->
Reader<HandlerDependencies, Task<any> | IO<any>>

<!-- Second acceptable type:  -->
(payload: any) => Reader<HandlerDependencies, Task<any> | IO<any>>
```

For the reducer we just defined, we'll write this handler:
```
import {FPReader} from 'react-use-fp'
import {CountActions} from './reducer'

<!-- notice the destructuring to get dispatch -->
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

4. Write a component that calls useFPReducer
```
<!-- The handler we just defined -->
import {getNewCount} from './handlers'
import {useFPReducer} from 'react-use-fp'

const CountDisplay: React.FunctionComponent<any> = (props) => {
	const [state, dispatch] = useFPReducer({
		GET_COUNT: getNewCount,
	})(
		initialState,
		countReducer
	)

	const onClick = (e: any) => dispatch({ type: 'GET_COUNT' });

	return <h1 onClick={onClick}>The current count is {state.count}</h1>;
};
```
And that's it!  You've got a typesafe, asynchronous control flow for your component that's cleanly separated from any rendering logic.