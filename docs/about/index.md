# About react-use-fp

## Motivation
Moderate-to-complex React applications may benefit from the enhanced type-safety of functional libraries like [fp-ts](https://github.com/gcanti/fp-ts), but, while React is reasonably declarative, it mixes a bit awkwardly with some "hardcore" functional concepts.  Consider:
```
const addToLocalStorage =
	(storedValue: string): IO<void> =>
	() =>
		localStorage.setItem('valueToStore', storedValue);

const StorageComponent: React.FunctionComponent<{ toStore: string }> = ({
	toStore,
}) => {
	// we manually invoke addToLocalStorage TWICE to run the IO
	const storeOnClick = () => addToLocalStorage(toStore)();

	return <MyCustomButton onClick={storeOnClick} />;
};
```
This is not inherently bad; the astute reader will have noticed that we can
simplify the above by writing the click handler like this:
```
const storeOnClick = addToLocalStorage(toStore);
```

However, for more complicated cases, it would be nice to have some inversion of control.  Hence this package.  `react-use-fp` has three main goals:
1. Help keep `React` coding paradigms out of our `fp-ts` code, and vice-versa, in the interest of readability;
2. Support code correctness by lightly restricting the shape our business logic can take; and
3. Introduce new folks to FP patterns (e.g. pipelines, the `Reader` monad) in a way that will immediately be familar to users of `React`/`Redux`. 

## Usage
`react-use-fp` is heavily inspired by [Redux](https://redux.js.org/) middleware.  Components interact with the outside world exclusively by dispatching actions.  All side effects, computations, and control flow are handled by pure function pipelines composed of [fp-ts](https://github.com/gcanti/fp-ts) constructs.  From here on, we'll refer to these pipelines as **action handlers**.  Action handlers *also* interact with the state exclusively by dispatching actions, and are themselves triggered by dispatched actions.

### Actions
Actions are plain JS object actions, exactly like `useReducer`/`Redux`.  However, they **must** satisfy the following interface to work correctly with `react-use-fp`:
```
interface Action<T> {
	type: string;
	payload?: T;
}
```
Additional properties shouldn't break anything, but also shouldn't be necessary, and are discouraged.

### Action handlers
Similar to Redux action creators, action handlers are pure functions that accept a dispatch function as a parameter and return a function representing the desired computation (`IO` or `Task`) that `react-use-fp` will correctly call at the appropriate time.  So, a basic action handler is of type `Reader<{dispatch: Dispatch<MyActions>}, IO<any> | Task<any>>`.  Here's an example of a basic action handler:
```
// Notice dispatch is destructured
const fetchDataForState = ({dispatch}) =>
	pipe(
		tryCatch(
			() => fetch('www.someApi.com'),
			(e) => `fetch failed for following reason: ${e}`
		),
		map((data) => dispatch({ type: 'FETCH_SUCCESS', payload: data })),
		mapLeft((errInfo) =>
			dispatch({ type: 'FETCH_FAILED', payload: errInfo })
		)
	);
```

Often, though, we want to pass some initial data for our action handler to operate on.  In this case, the action handler's type would be
```
(t: PayloadType) => Reader<{dispatch: Dispatch<MyActions>}, IO<any> | Task<any>>
```
Here's what the basic action handler above might look like if we updated it to accept a payload to operate on:
```
//payload action handler
const fetchDataForState = (apiAddress: string) => ({dispatch}) =>
	pipe(
		tryCatch(
			() => fetch(apiAddress),
			(e) => `fetch failed for following reason: ${e}`
		),
		map((data) => dispatch({ type: 'FETCH_SUCCESS', payload: data })),
		mapLeft((errInfo) =>
			dispatch({ type: 'FETCH_FAILED', payload: errInfo })
		)
	);
```

### useFPReducer
A curried function that accepts 2 'rounds' of arguments.  This is slightly complicated, so let's break it down. We'll write some example code just like what we saw above, then see how to plug it into `useFPReducer`.  As a sidenote, if you've worked with [`redux-toolkit`](https://redux-toolkit.js.org/) before, this will look familiar.  First, we set up some state:
```
interface SetCountAction {
	type: 'SET_COUNT';
	payload: number;
}

interface CountState {
	count: number;
}

type CountAction = InitCountAction | SetCountAction;

const countReducer: Reducer<CountState, CountAction> = (state, action) => {
	switch (action.type) {
		case 'SET_COUNT':
			return { count: action.payload };
		default:
			return { ...state };
	}
};
```

Next, write our handler:
```
const countHandler =
	({dispatch}) =>
	() =>
		dispatch({ type: 'SET_COUNT', payload: 42 });

```

And finally, our component.  Notice the **first argument** to `useFPReducer` is a plain object with one property.  This object's single key will become the `Action` type that triggers our handler function, and the associated property is the function itself.  In the second call, we pass in the inital state and reducer we defined above.  `state` and `dispatch` are exactly what you expect them to be--use them as if they were returned from vanilla `useReducer`.
```
const CountDisplay: React.FunctionComponent<any> = (props) => {
	const [state, dispatch] = useFPReducer({UPDATE_COUNT: countHandler})(initialState, countReducer)

	const onClick = (e) => dispatch({ type: 'GET_COUNT' });

	return <h1 onClick={onClick}>The current count is: {state.count}</h1>;
};
```
And that's it!  To control the new count instead of always setting it to 42, update the action handler to accept a `newCount` parameter...
```
const countHandler = (newCount: number) =>
	({dispatch}) =>
	() =>
		dispatch({ type: 'SET_COUNT', payload: newCount });
```

...and add a payload to the action that initiates the action creator
```
const CountDisplay: React.FunctionComponent<{newCount: number}> = ({newCount}) => {
	const [state, dispatch] = useFPReducer({UPDATE_COUNT: countHandler})(initialState, countReducer)

	const onClick = (e) => dispatch({ type: 'UPDATE_COUNT', payload: newCount });

	return <h1 onClick={onClick}>The current count is: {state.count}</h1>;
};
```
As long as a payload is dispatched, the hook will correctly invoke the action handler at the appropriate time.

For examples of `useFPReducer` with handlers that depend on more than just dispatch, check out [the examples section](https://rossh87.github.io/react-use-fp/examples).