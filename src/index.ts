import { useReducer, Dispatch, Reducer, ReducerAction } from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	AcceptObserver,
	Action,
	ComposableMiddleware,
	DependencyCreator,
	DependencyType,
	FPContextTools,
	HandlerDependencies,
	HandlerKinds,
	ObservedActions,
	PendingTracker,
	ActionMap,
	Observer,
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
const handlers = [];
const observed: ObservedActions<any> = {};
const pendingPromises: PendingTracker = { pending: 0 };
let isFirstRun = true;
let dispatch: Dispatch<any>;

export const useFPReducer =
	<
		S,
		A extends { type: string; payload?: any },
		D extends DependencyCreator<A> = DependencyCreator<A>
	>(
		initial: S,
		reducer: Reducer<S, A>,
		acceptObserver?: AcceptObserver<A>
	) =>
	(actionMap: ActionMap<S, A, D>, createDependencies?: D) => {
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
			<D extends HandlerDependencies<A>, T = undefined>(
				type: A['type']
			) =>
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

		// setup the middlewares here
		if (isFirstRun) {
			pipe(
				keys(actionMap),
				ArrMap((key) => {
					withDispatch<HandlerDependencies<A>, A['payload']>(key)(
						actionMap[key],
						createDependencies
					);
				})
			);

			dispatch = handlers.reduceRight(
				(next, fn) => fn(baseDispatch)(next),
				baseDispatch
			);

			isFirstRun = false;
		}

		return [state, dispatch] as [S, Dispatch<A>];
	};
