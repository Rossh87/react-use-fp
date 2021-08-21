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
} from './helpers';
import { toMiddleware, toPartialEffect } from './effect';
import { map as ArrMap, reduce } from 'fp-ts/Array';
import { Handler } from './types';

// mutable state for handlers
let dispatchers: Dispatch<any>[] = [];
let observed: ObservedActions<any> = {};
const pendingPromises: PendingTracker = { pending: 0 };
let usedActions = new Set<string>();

export const resetInternals = () => {
	dispatchers = [];
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
		const addDispatcher = (dispatcher: (a: A) => void) =>
			dispatchers.push(dispatcher);

		const withDispatch =
			(type: string) =>
			(
				handler: Handler<A, any, D>,
				createDependencies?: DependencyCreator<A, D>
			): ComposableMiddleware<A> =>
				pipe(
					toPartialEffect<A>(handler)(type)(createDependencies),
					toMiddleware<A>(promiseResolutionTracker)(subbableDispatch)
				);

		/**This only adds a new middleware if the actionMap has keys
		 * we haven't seen before
		 */
		pipe(
			Object.keys(actionMap),
			filterAndSetActionTypes(usedActions),
			ArrMap((key) =>
				withDispatch(key)(actionMap[key], createDependencies)
			),
			reduce(baseDispatch, (next, fn) => fn(baseDispatch)(next)),
			addDispatcher
		);

		const dispatch = (a: A) => dispatchers.forEach((d) => d(a));

		return [
			state,
			dispatch as Dispatch<A | { type: keyof R; payload: any }>,
		] as const;
	};
