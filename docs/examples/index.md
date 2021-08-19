---
layout: home
---
# Examples

Unless otherwise indicated, all the examples use the same reducer and actions, specified here:
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
-	[Passing dependencies (beyond dispatch) to a handler](https://rossh87.github.io/react-use-fp/examples/dependency-injection)
-	[Using optional subscriber argument with useFPReducer](https://rossh87.github.io/react-use-fp/examples/subscriber)
-	[Testing](https://rossh87.github.io/react-use-fp/examples/testing))