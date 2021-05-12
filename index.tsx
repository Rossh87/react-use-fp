import { useReducer, Dispatch, Reducer } from 'react';
import {
	fromPredicate,
	map,
	fromNullable,
	fold,
	getRefinement,
	some,
	none,
	alt,
	altW,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { Reader } from 'fp-ts/lib/Reader';
import { ap } from 'fp-ts/lib/Identity';

interface Action<T> {
	type: string;
	payload?: T;
}

export type DispatchReader<A> = Reader<Dispatch<A>, any>;

export type PayloadDispatchReader<A, T> = (t: T) => Reader<Dispatch<A>, any>;

export type DependencyReader<D> = Reader<D, any>;

export type PayloadDependencyReader<D, T> = (t: T) => Reader<D, any>;

type Handler<A, D, T> =
	| DispatchReader<A>
	| PayloadDispatchReader<A, T>
	| DependencyReader<D>
	| PayloadDependencyReader<D, T>;

interface DispatchActionReceiver<A, T> {
	_receiverTag: 'dispatch';
	type: string;
	handler: DispatchReader<A> | PayloadDispatchReader<A, T>;
}

interface DependencyActionReceiver<A, D, T> {
	_receiverTag: 'dependency';
	type: string;
	handler: DependencyReader<D> | PayloadDependencyReader<D, T>;
	makeDependencies: (a: Dispatch<A>) => D;
}

type ActionReceiver<A, D, T> =
	| DispatchActionReceiver<A, T>
	| DependencyActionReceiver<A, D, T>;

interface ComposableMiddleware<A extends Action<any>> {
	(dispatch: Dispatch<A>): (next: Dispatch<A>) => (action: A) => void;
}

export interface DependencyCreator<
	A,
	D extends { dispatch: Dispatch<A> } = { dispatch: Dispatch<A> }
> {
	(dispatch: Dispatch<A>): D;
}

export const useFPMiddleware = <S, A extends Action<any>>(
	r: Reducer<S, A>,
	initialState: S
) => {
	const [state, baseDispatch] = useReducer<Reducer<S, A>>(r, initialState);

	const handlers: ComposableMiddleware<A>[] = [];

	const addMiddleware = (handler: ComposableMiddleware<A>) =>
		handlers.push(handler);

	const maybeGetPayload = (action: A) =>
		pipe(action, (a) => a.payload, fromNullable);

	const maybeMatchType =
		<D, T>(action: A) =>
		(receiver: ActionReceiver<A, D, T>) =>
			pipe(
				action,
				fromPredicate((t) => t.type === receiver.type)
			);

	const callHandlerWithDependencies =
		<D, T>(receiver: DependencyActionReceiver<A, D, T>) =>
		(action: A) =>
		(dispatch: Dispatch<A>) =>
			pipe(
				action,
				maybeGetPayload,
				fold(
					() =>
						pipe(
							dispatch,
							receiver.makeDependencies,
							receiver.handler as DependencyReader<D>
						)(),
					(payload: T) =>
						pipe(
							dispatch,
							receiver.makeDependencies,
							(receiver.handler as PayloadDependencyReader<D, T>)(
								payload
							)
						)()
				)
			);

	const callHandlerWithDispatch =
		<T,>(receiver: DispatchActionReceiver<A, T>) =>
		(action: A) =>
		(dispatch: Dispatch<A>) =>
			pipe(
				action,
				maybeGetPayload,
				fold(
					() =>
						pipe(dispatch, receiver.handler as DispatchReader<A>)(),
					(payload: T) =>
						pipe(
							dispatch,
							(receiver.handler as PayloadDispatchReader<A, T>)(
								payload
							)
						)()
				)
			);

	const toComposable =
		<D, T>(receiver: ActionReceiver<A, D, T>): ComposableMiddleware<A> =>
		(dispatch) =>
		(next) =>
		(action) =>
			pipe(
				maybeMatchType<D, T>(action)(receiver),
				map(() =>
					pipe(
						receiver,
						fromPredicate<
							ActionReceiver<A, D, T>,
							DependencyActionReceiver<A, D, T>
						>(
							getRefinement((r) =>
								r._receiverTag === 'dependency' ? some(r) : none
							)
						),
						map(callHandlerWithDependencies),
						map(ap(action)),
						map(ap(dispatch)),
						alt(() =>
							some(
								pipe(
									callHandlerWithDispatch,
									ap(
										receiver as DispatchActionReceiver<A, T>
									),
									ap(action),
									ap(dispatch)
								)
							)
						)
					)
				),
				fold(
					() => next(action),
					(a) => next(action)
				)
			);

	const withDispatch =
		<D extends { dispatch: Dispatch<A> } | Dispatch<A>, T = any>(
			type: A['type']
		) =>
		(
			handler: Handler<A, D, T>,
			makeDependencies?: (dispatch: Dispatch<A>) => D
		) =>
			pipe(
				makeDependencies,
				fromNullable,
				map(
					(makeDependencies) =>
						({
							_receiverTag: 'dependency' as 'dependency',
							handler,
							type,
							makeDependencies,
						} as DependencyActionReceiver<A, D, T>)
				),
				altW(() =>
					some({
						_receiverTag: 'dispatch' as 'dispatch',
						handler,
						type,
					} as DispatchActionReceiver<A, T>)
				),
				map(toComposable),
				map(addMiddleware)
			);

	const dispatch = (action: A) =>
		handlers.reduceRight(
			(next, fn) => fn(baseDispatch)(next),
			baseDispatch
		)(action);

	return [state, dispatch, withDispatch] as [
		S,
		Dispatch<A>,
		typeof withDispatch
	];
};
