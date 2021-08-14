import { pipe } from 'fp-ts/lib/function';
import {
	Action,
	Effect,
	HandlerKinds,
	HandlerDependencies,
	DependencyCreator,
	PreEffect,
} from './types';
import {
	isDependencyCreator,
	isDispatchDependency,
	isPayloadDispatchDependency,
	isPayloadProductDependency,
	isProductDependency,
} from './guards';
import { bind, Do } from 'fp-ts/Identity';
import { Dispatch } from 'react';
import {
	dispatchCallStrat,
	payloadDispatchCallStrat,
	payloadProductCallStrat,
	productCallStrat,
} from './strategies';
import { map as OMap, fromPredicate } from 'fp-ts/Option';

const tagEffect = <A extends Action<any>, D extends HandlerDependencies<A>, T>({
	dependencies,
	payload,
}: Pick<Effect<A, D, T>, 'dependencies' | 'payload'>) => {
	const hasPayload = !!payload;

	const hasProductDependencies = typeof dependencies === 'object';

	return hasPayload
		? hasProductDependencies
			? 'payloadProductDependency'
			: 'payloadDispatchDependency'
		: hasProductDependencies
		? 'productDependency'
		: 'dispatchDependency';
};

export const toPartialEffect =
	<A extends Action<any>, D extends HandlerDependencies<A>, T>(
		handler: HandlerKinds<A, D, T>
	) =>
	(type: A['type']) =>
	(createDeps: DependencyCreator<A> | undefined): PreEffect<A, D, T> =>
		pipe(
			Do,
			bind('type', () => type),
			bind('handler', () => handler),
			bind('createDependencies', () => createDeps)
		);

export const toMiddleware =
	<A extends Action<any>, D extends HandlerDependencies<A>, T>(
		promiseTracker: (a: unknown) => void
	) =>
	(
		makeObservableDispatch: (
			matched: A['type']
		) => (dispatch: Dispatch<A>) => Dispatch<A>
	) =>
	(pe: PreEffect<A, D, T>) =>
	(dispatch: Dispatch<A>) =>
	(next: Dispatch<A>) =>
	(action: A) =>
		pipe(
			action,
			fromPredicate((a) => a.type === pe.type),
			OMap(() =>
				pipe(
					pe,
					bind('dependencies', ({ createDependencies }) => {
						const observableDispatch = makeObservableDispatch(
							action.type
						)(dispatch);

						return isDependencyCreator(createDependencies)
							? createDependencies(observableDispatch)
							: observableDispatch;
					}),
					bind('payload', () => action.payload),
					bind('_effectTag', tagEffect),
					runEffect(promiseTracker),
					() => next(action)
				)
			)
		);

export const runEffect =
	<A extends Action<any>, D extends HandlerDependencies<A>, T>(
		promiseTracker: (a: unknown) => void
	) =>
	(effect: Effect<A, D, T>) =>
		pipe(
			isDispatchDependency(effect)
				? pipe(effect, dispatchCallStrat)
				: isPayloadDispatchDependency(effect)
				? pipe(effect, payloadDispatchCallStrat)
				: isProductDependency(effect)
				? pipe(effect, productCallStrat)
				: isPayloadProductDependency(effect)
				? pipe(effect, payloadProductCallStrat)
				: null,
			promiseTracker
		);
