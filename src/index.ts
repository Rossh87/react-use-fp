import { useReducer, Reducer, Dispatch } from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	ComposableMiddleware,
	DependencyCreator,
	ObservedActions,
	PendingTracker,
	ReaderDependencies,
} from './types';
import {
	makePendingPromiseTracker,
	filterAndSetActionTypes,
	makeSubscribableDispatch,
	makeActionCreators,
} from './helpers';
import { toMiddleware, toPreEffect } from './effect';
import { map as ArrMap } from 'fp-ts/Array';
import { Handler } from './types';

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
		D extends ReaderDependencies<any, Record<string, any>>,
		R extends Record<string, any>
	>(
		actionMap: R,
		createDependencies?: DependencyCreator<any, D>,
		subscriber?: (a: any) => void
	) =>
	<S, A extends { type: string; payload?: any }>(
		initial: S,
		reducer: Reducer<S, A>
	) => {
		const [state, baseDispatch] = useReducer(reducer, initial);

		// build trackers
		const promiseResolutionTracker =
			makePendingPromiseTracker(pendingPromises);
		const subbableDispatch = makeSubscribableDispatch(subscriber);

		// begin business logic
		const addMiddleware = (mw: ComposableMiddleware<A>) =>
			handlers.push(mw);

		const withDispatch =
			(type: string) =>
			(
				handler: Handler<A, any, D>,
				createDependencies?: DependencyCreator<A, D>
			) =>
				pipe(
					toPreEffect<A>(handler)(type)(createDependencies),
					toMiddleware<A>(promiseResolutionTracker)(subbableDispatch),
					addMiddleware
				);

		/**This only adds a new middleware if the actionMap has keys
		 * we haven't seen before
		 */
		pipe(
			Object.keys(actionMap),
			filterAndSetActionTypes(usedActions),
			ArrMap((key) => {
				withDispatch(key)(actionMap[key], createDependencies);
			})
		);

		/**
		 It would be more efficient to store these pre-composed, and then compose
		 the PRE-COMPOSED with a new composition whenever we add new middlewares.
		 */
		let dispatch = (a: A) =>
			handlers.reduceRight(
				(next, fn) => fn(baseDispatch)(next),
				baseDispatch
			)(a);

		const actions = makeActionCreators(actionMap);

		return [
			state,
			dispatch as Dispatch<A | { type: keyof R; payload?: any }>,
			actions,
		] as const;
	};

export { Action, FPReader, PayloadFPReader, DependencyCreator } from './types';
