# react-use-fp

## Motivation
Functional programmers designing client-side applications that require moderate to complex data manipulation may find it helpful to use [fp-ts](https://github.com/gcanti/fp-ts) in React applications. Because React is a [fundamentally imperative framework](https://github.com/gcanti/fp-ts/issues/900), we may sometimes be forced to explicitly execute our pure function pipelines.  Consider:
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
This is not inherently bad, and is probably the best approach for simple cases; the astute reader will have noticed that we can
simplify the above by writing the click handler like this:
```
const storeOnClick = addToLocalStorage(toStore);
```

However, for component trees that manage their state via `useReducer`, a more consistent and explicit approach may be helfpul.  `react-use-fp` is a hook that offers one such approach.  It has two goals:
1. Present a simple API that will immediately be familiar to React users
2. Enforce clear boundaries between UI code, business logic, and component state

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
Similar to Redux action creators, action handlers are pure functions that accept a dispatch function as a parameter and return a function representing the desired computation (`IO` or `Task`) that `react-use-fp` will correctly call at the appropriate time.  So, a basic action handler is of type `Reader<Dispatch<MyActions>, IO<any> | Task<any>>`.  Here's an example of a basic action handler:
```
//basic action handler
const fetchDataForState = (dispatch) =>
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
type PayloadDispatchHandler<T> = (payload: T) => Reader<Dispatch<MyActions>, IO<any> | Task<any>>
```
Here's what the basic action handler above might look like if we updated it to accept a payload to operate on:
```
//payload action handler
const fetchDataForState = (apiAddress: string) => (dispatch) =>
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

### useFPMiddleware
Identical to `useReducer`, except that it returns a tuple of three elements instead of two.  The first two are, once again, identical to `state` and `dispatch` returned by `useReducer`. The third (we'll call it `withDispatch`) is a curried function that normally accepts two arguments, and is used to associate an action handler with the action type that will initiate it. So, a simple component that uses `use-react-fp` looks like this:
```
// types & actions
interface InitCountAction {
	type: 'INIT_COUNT';
}

interface SetCountAction {
	type: 'SET_COUNT';
	payload: number;
}

interface CountState {
	count: number;
}

type CountAction = InitCountAction | SetCountAction;

// reducer
const countReducer: Reducer<CountState, CountAction> = (state, action) => {
	switch (action.type) {
		case 'SET_COUNT':
			return { count: action.payload };
		default:
			return { ...state };
	}
};

// action handler
const countHandler =
	(dispatch: Dispatch<CountAction>): IO<void> =>
	() =>
		dispatch({ type: 'SET_COUNT', payload: 42 });

// component
const CountComponent: FunctionComponent = (props) => {
	const [state, dispatch, withDispatch] = useFPMiddleware(countReducer, {
		count: 0,
	});

	//initialize the action handler.  It will run when an action of type 'INIT_COUNT' is dispatched.
	withDispatch('INIT_COUNT')(countHandler);

	return (
		<div>
			<h1>
				Hello! The count is currently {state.count}, but you can update
				it by clicking!
			</h1>
			<button onClick={() => dispatch({ type: 'INIT_COUNT' })}></button>
		</div>
	);
};
```
Often we would like to control what the new count will be instead of always setting it to 42.  To get there, first update the action handler to accept a `newCount` parameter:
```
const countHandler = (newCount: number) =>
	(dispatch: Dispatch<CountAction>): IO<void> =>
	() =>
		dispatch({ type: 'SET_COUNT', payload: newCount });
```

Next, simply add a payload to the action that initiates the action creator--in this case, `'INIT_COUNT'`.  So our updated component could look like this:
```
//CountComponent accepts the new count as a prop
const CountComponent: FunctionComponent<{newCount: number}> = ({newCount}) => {
	const [state, dispatch, withDispatch] = useFPMiddleware(countReducer, {
		count: 0,
	});

	withDispatch('INIT_COUNT')(countHandler);

	return (
		<div>
			<h1>
				Hello! The count is currently {state.count}, but you can update
				it by clicking!
			</h1>
			// dispatch the new count as a payload when button is clicked
			<button onClick={() => dispatch({ type: 'INIT_COUNT', payload: newCount })}></button>
		</div>
	);
};
```
As long as a payload is dispatched, the hook will correctly invoke the action handler at the appropriate time.

### Advanced Action Handler Dependencies
Sometimes we might want to inject multiple dependencies into an action handler, not just `dispatch`.  For example, injecting an HTTP library in this way makes it easy to pass in a mock implementation for testing.  `withDispatch` accepts an optional third argument to handle this case.  This argument must be a function that accepts `dispatch` as its only parameter, and returns an object containing all desired dependencies as properties, *including* `dispatch`.  So, if we would like to inject the HTTP request library `axios` into our action handler, it might look like this:
```
// dependency interface
interface Dependencies {
	dispatch: Dispatch<FetchActions>;
	http: AxiosInstance;
}

// action handler
const fetchDataForState = (dependencies: Dependencies) =>
	pipe(
		tryCatch(
			() => dependencies.http.get('www.someApi.com'),
			(e) => `fetch failed for following reason: ${e}`
		),
		map((data) =>
			dependencies.dispatch({ type: 'FETCH_SUCCESS', payload: data })
		),
		mapLeft((errInfo) =>
			dependencies.dispatch({ type: 'FETCH_FAILED', payload: errInfo })
		)
	);

// dependency creation function
const makeDeps = (dispatch: Dispatch<FetchActions>) => ({
	dispatch,
	http: axios,
});

// component
const CountComponent: FunctionComponent = (props) => {
	const [state, dispatch, withDispatch] = useFPMiddleware(
		fetchedDataReducer,
		{
			fetchedData: null,
		}
	);

	// notice that the dependency creation function is NOT curried out
	withDispatch<FetchActions, Dependencies>('INIT_COUNT')(
		countHandler,
		makeDeps
	);

	return (
		<div>
			<h1>
				Hello! The count is currently {state.count}, but you can update
				it by clicking!
			</h1>
			<button onClick={() => dispatch({ type: 'INIT_COUNT' })}></button>
		</div>
	);
};
```
Other than the third argument passed to `withDispatch`, this kind of action handler works identically to handlers that only depend on dispatch.  To pass data into an action handler with advanced dependencies, simply add the desired data as a payload in the action that the handler is associated with.