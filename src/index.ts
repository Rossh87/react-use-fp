import { useReducer, Dispatch, Reducer, ReducerAction } from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	AcceptObserver,
	Action,
	ComposableMiddleware,
	DependencyCreator,
	ObservedActions,
	PendingTracker,
	ActionMap,
	Observer,
	FPReader,
	PayloadFPReader,
} from './types';
import {
	makePendingPromiseTracker,
	makeObservableDispatch,
	makeObserver,
} from './helpers';
import { toMiddleware, toPartialEffect } from './effect';
import { fromNullable, map as OMap } from 'fp-ts/Option';
import { keys } from 'fp-ts/Record';
import { map as ArrMap } from 'fp-ts/Array';

// mutable state for handlers
const handlers: ComposableMiddleware<any>[] = [];
const observed: ObservedActions<any> = {};
const pendingPromises: PendingTracker = { pending: 0 };
let isFirstRun = true;
let dispatch: Dispatch<any>;

export const useFPReducer =
	<
		S,
		A extends { type: string; payload?: any },
		D extends DependencyCreator<A>
	>(
		initial: S,
		reducer: Reducer<S, A>,
		acceptObserver?: AcceptObserver<A>
	) =>
	(actionMap: ActionMap<S, A>, createDependencies?: D) => {
		const [state, baseDispatch] = useReducer(reducer, initial);

		// mutable state for tracking execution
		const promiseResolutionTracker =
			makePendingPromiseTracker(pendingPromises);
		const odm = makeObservableDispatch(observed);

		// pass back function to read execution state
		pipe(
			acceptObserver,
			fromNullable,
			OMap((fn) => pipe(makeObserver(pendingPromises)(observed), fn))
		);

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
					toMiddleware<A>(promiseResolutionTracker)(odm),
					addMiddleware
				);

		// setup the middlewares here
		if (isFirstRun) {
			pipe(
				keys(actionMap),
				ArrMap((key) => {
					withDispatch(key)(actionMap[key], createDependencies);
				})
			);

			dispatch = (a: A) =>
				handlers.reduceRight(
					(next, fn) => fn(baseDispatch)(next),
					baseDispatch
				)(a);

			isFirstRun = false;
		}

		return [state, dispatch] as const;
	};
