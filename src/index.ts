import { useReducer, Reducer } from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	ComposableMiddleware,
	DependencyCreator,
	ObservedActions,
	PendingTracker,
	ActionMap,
} from './types';
import {
	makePendingPromiseTracker,
	filterAndSetActionTypes,
	makeSubscribableDispatch,
} from './helpers';
import { toMiddleware, toPartialEffect } from './effect';
import { map as ArrMap } from 'fp-ts/Array';

// mutable state for handlers
let handlers: ComposableMiddleware<any>[] = [];
let observed: ObservedActions<any> = {};
const pendingPromises: PendingTracker = { pending: 0 };
let usedActions = new Set<string>();

export const resetInternals = () => {
	handlers = [];
	observed = {};
	usedActions.clear();
	pendingPromises.pending = 0;
};

export const useFPReducer =
	<
		S,
		A extends { type: string; payload?: any },
		D extends DependencyCreator<A>
	>(
		initial: S,
		reducer: Reducer<S, A>,
		subscriber?: (a: A) => void
	) =>
	(actionMap: ActionMap<S, A>, createDependencies?: D) => {
		const [state, baseDispatch] = useReducer(reducer, initial);

		// mutable state for tracking execution
		const promiseResolutionTracker =
			makePendingPromiseTracker(pendingPromises);
		const subbableDispatch = makeSubscribableDispatch(subscriber);

		// begin business logic
		const addMiddleware = (mw: ComposableMiddleware<A>) =>
			handlers.push(mw);

		const withDispatch =
			(type: A['type']) =>
			(
				handler: typeof actionMap['type'],
				createDependencies?: DependencyCreator<A>
			) =>
				pipe(
					toPartialEffect<A>(handler)(type)(createDependencies),
					toMiddleware<A>(promiseResolutionTracker)(subbableDispatch),
					addMiddleware
				);

		// setup the middlewares here.  Only add a middleware
		// handler for action types we haven't seen before
		pipe(
			Object.keys(actionMap),
			filterAndSetActionTypes(usedActions),
			ArrMap((key) => {
				withDispatch(key)(actionMap[key], createDependencies);
			})
		);

		let dispatch = (a: A) =>
			handlers.reduceRight(
				(next, fn) => fn(baseDispatch)(next),
				baseDispatch
			)(a);

		return [state, dispatch] as const;
	};
