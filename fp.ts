import React, { useReducer, Dispatch, Reducer } from 'react';
import {
	fromPredicate,
	map,
	fromNullable,
	fold,
	getRefinement,
	some,
	none,
	chain,
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

interface DispatchActionReceiver<T extends Action<any>> {
	_receiverTag: 'dispatch';
	type: T['type'];
	handler: DispatchReader<T>;
}

interface DependencyActionReceiver<T extends Action<any>> {
	_receiverTag: 'dependency';
	type: T['type'];
	handler: DependencyReader<T>;
	makeDependencies: (a: Dispatch<T>) => Dependencies<T>;
}

type ActionReceiver<T extends Action<any>> =
	| DispatchActionReceiver<T>
	| DependencyActionReceiver<T>;

interface ComposableMiddleware<T extends Action<any>> {
	(dispatch: Dispatch<T>): (next: Dispatch<T>) => (action: T) => void;
}

interface BaseDependencies<T extends Action<any>> {
	dispatch: Dispatch<T>;
}

interface Dependencies<T extends Action<any>> extends BaseDependencies<T> {}

type DispatchReader<T extends Action<any>> =
	| Reader<Dispatch<T>, any>
	| ((t: T['payload']) => Reader<Dispatch<T>, any>);

type DependencyReader<T extends Action<any>> =
	| Reader<Dependencies<T>, any>
	| ((t: T['payload']) => Reader<Dependencies<T>, any>);

type Handler<T extends Action<any>> = DispatchReader<T> | DependencyReader<T>;

export const useFPMiddleware = <S, A extends Action<any>>(
	r: Reducer<S, A>,
	initialState: S
): [S, Dispatch<A>, (type: A['type']) => (handler: Handler<A>) => void] => {
	const [state, baseDispatch] = useReducer<Reducer<S, A>>(r, initialState);

	const handlers: ComposableMiddleware<A>[] = [];

	const addMiddleware = (handler: ComposableMiddleware<A>) =>
		handlers.push(handler);

	const maybeGetPayload = (action: A) =>
		pipe(action, (a) => a.payload, fromNullable);

	const maybeMatchType = (action: A) => (receiver: ActionReceiver<A>) =>
		pipe(
			action,
			fromPredicate((t) => t.type === receiver.type)
		);

	const callHandlerWithDependencies = (
		receiver: DependencyActionReceiver<A>
	) => (action: A) => (dispatch: Dispatch<A>) =>
		pipe(
			action,
			maybeGetPayload,
			fold(
				() => receiver.handler(receiver.makeDependencies(dispatch))(),
				(payload) =>
					receiver.handler(payload)(
						receiver.makeDependencies(dispatch)
					)()
			)
		);

	const callHandlerWithDispatch = (receiver: DispatchActionReceiver<A>) => (
		action: A
	) => (dispatch: Dispatch<A>) =>
		pipe(
			action,
			maybeGetPayload,
			fold(
				() => receiver.handler(dispatch)(),
				(payload) => receiver.handler(payload)(dispatch)()
			)
		);

	const isDependencyReceiver = fromPredicate(
		getRefinement<ActionReceiver<A>, DependencyActionReceiver<A>>((r) =>
			r._receiverTag === 'dependency' ? some(r) : none
		)
	);

	const toComposable = (
		receiver: ActionReceiver<A>
	): ComposableMiddleware<A> => (dispatch) => (next) => (action) =>
		pipe(
			maybeMatchType(action)(receiver),
			map(() => receiver),
			chain(isDependencyReceiver),
			map(callHandlerWithDependencies),
			map(ap(action)),
			map(ap(dispatch)),
			alt(() =>
				some(
					pipe(
						callHandlerWithDispatch,
						ap(receiver as DispatchActionReceiver<A>),
						ap(action),
						ap(dispatch)
					)
				)
			),
			map(() => next(action))
		);

	const withDispatch = (type: A['type']) => (
		handler: Handler<A>,
		makeDependencies?: (dispatch: Dispatch<A>) => Dependencies<A>
	) =>
		pipe(
			makeDependencies,
			fromNullable,
			map((makeDependencies) => ({
				_receiverTag: 'dependency' as 'dependency',
				handler,
				type,
				makeDependencies,
			})),
			altW<DispatchActionReceiver<A>>(() =>
				some({
					_receiverTag: 'dispatch' as 'dispatch',
					handler,
					type,
				})
			),
			map(toComposable),
			map(addMiddleware)
		);

	const dispatch = (action: A) =>
		handlers.reduceRight(
			(next, fn) => fn(baseDispatch)(next),
			baseDispatch
		)(action);

	return [state, dispatch, withDispatch];
};
