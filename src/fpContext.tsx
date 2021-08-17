import React, {
	createContext,
	Dispatch,
	Reducer,
	useContext,
	useReducer,
} from 'react';
import { pipe } from 'fp-ts/lib/function';
import {
	AcceptObserver,
	Action,
	ComposableMiddleware,
	DependencyCreator,
	ObservedActions,
	PendingTracker,
	ActionMap,
	ExecutionState,
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

const getNewFPClosure = () => {
	const executionState: ExecutionState = {
		dispatch: () => {},
		handlers: [],
		observed: {},
		pendingPromises: { pending: 0 },
		isFirstRun: true,
	};

	const useFPReducer =
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
			const { handlers, observed, pendingPromises, isFirstRun } =
				executionState;
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

				executionState.dispatch = (a: A) =>
					handlers.reduceRight(
						(next, fn) => fn(baseDispatch)(next),
						baseDispatch
					)(a);

				executionState.isFirstRun = false;
			}

			return [
				state,
				executionState.dispatch,
				() => executionState,
			] as const;
		};

	return useFPReducer;
};

const makeFPContext =
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
		const fpDispatch = createContext(null as unknown as Dispatch<A>);
		const fpState = createContext(null as unknown as S);
		const observerContext = createContext(
			null as unknown as () => ExecutionState
		);

		const [state, dispatch, observe] = getNewFPClosure()(
			initial,
			reducer,
			acceptObserver
		)(actionMap, createDependencies);

		const Provider: React.FunctionComponent = ({ children }) => {
			return (
				<fpState.Provider value={state}>
					<fpDispatch.Provider value={dispatch}>
						<observerContext.Provider value={observe}>
							{children}
						</observerContext.Provider>
					</fpDispatch.Provider>
				</fpState.Provider>
			);
		};

		const useFPState = () => useContext(fpState);
		const useFPDispatch = () => useContext(fpDispatch);
		const useFPObserver = () => useContext(observerContext);

		return [useFPState, useFPDispatch, Provider] as const;
	};

export default makeFPContext;
