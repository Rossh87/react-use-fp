import { useReducer, Dispatch, Reducer } from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	AcceptObserver,
	Action,
	ComposableMiddleware,
	DependencyCreator,
	HandlerDependencies,
	HandlerKinds,
	ObservedActions,
	PendingTracker,
} from './types';
import {
	makePendingPromiseTracker,
	makeObservableDispatch,
	makeObserver,
} from './helpers';
import { toMiddleware, toPartialEffect } from './effect';
import { fromNullable, map as OMap } from 'fp-ts/Option';

// mutable state for handlers
const handlers = [];
const observed: ObservedActions<any> = {};
const pendingPromises: PendingTracker = { pending: 0 };

export const useFPMiddleware = <S, A extends Action<any>>(
	r: Reducer<S, A>,
	initialState: S,
	acceptObserver?: AcceptObserver
) => {
	// setup reducer
	const [state, baseDispatch] = useReducer<Reducer<S, A>>(r, initialState);

	// mutable state for tracking execution
	const promiseResolutionTracker = makePendingPromiseTracker(pendingPromises);
	const odm = makeObservableDispatch(observed);

	// pass back function to read execution state
	pipe(
		acceptObserver,
		fromNullable,
		OMap((fn) => pipe(makeObserver(pendingPromises)(observed), fn))
	);

	// begin business logic
	const addMiddleware = (mw: ComposableMiddleware<A>) => handlers.push(mw);

	const withDispatch =
		<D extends HandlerDependencies<A>, T = undefined>(type: A['type']) =>
		(
			handler: HandlerKinds<A, D, T>,
			createDependencies?: DependencyCreator<A>
		) =>
			pipe(
				toPartialEffect<A, D, T>(handler)(type)(createDependencies),
				toMiddleware<A, D, T>(promiseResolutionTracker)(odm),
				addMiddleware,
				() => {}
			);

	const dispatch = (a: A) =>
		handlers.reduceRight(
			(next, fn) => fn(baseDispatch)(next),
			baseDispatch
		)(a);

	return [state, dispatch, withDispatch] as [
		S,
		Dispatch<A>,
		typeof withDispatch
	];
};
