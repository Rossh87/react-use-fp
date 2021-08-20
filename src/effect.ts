import { pipe } from 'fp-ts/lib/function';
import {
	Action,
	Effect,
	DependencyCreator,
	PreEffect,
	EffectKinds,
	Handler,
	FPEffect,
	PayloadFPEffect,
} from './types';
import { isFPEffect } from './guards';
import { bind, Do } from 'fp-ts/Identity';
import { Dispatch } from 'react';
import { FPEffectCallStrat, PayloadFPEffectCallStrat } from './strategies';
import { fromNullable, fold, map as OMap, fromPredicate } from 'fp-ts/Option';

const tagEffect = <A extends Action<any>>({
	payload,
}: Pick<Effect<A>, 'dependencies' | 'payload'>): EffectKinds =>
	pipe(
		payload,
		fromNullable,
		fold(
			() => 'FPReader',
			() => 'payloadFPReader'
		)
	);

export const toPartialEffect =
	<A extends Action<any>>(handler: Handler<A, any, any>) =>
	(type: A['type']) =>
	(createDeps?: DependencyCreator<A, any>) =>
		pipe(
			Do,
			bind('type', () => type),
			bind('handler', () => handler),
			bind('createDependencies', () => createDeps)
		);

export const toMiddleware =
	<A extends Action<any>>(promiseTracker: (a: unknown) => void) =>
	(subscribableDispatch: (a: Dispatch<A>) => Dispatch<A>) =>
	(pe: PreEffect<A>) =>
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
						const subscribedDispatch =
							subscribableDispatch(dispatch);

						// wrangle dispatch function into an object if no
						// createDependencies function was passed in
						return pipe(
							createDependencies,
							fromNullable,
							fold(
								() => ({ dispatch: subscribedDispatch }),
								(c) => c(subscribedDispatch)
							)
						);
					}),
					bind('payload', () => action.payload),
					bind('_effectTag', tagEffect),
					runEffect(promiseTracker),
					() => next(action)
				)
			)
		);

export const runEffect =
	<A extends Action<any>>(promiseTracker: (a: unknown) => void) =>
	(effect: Effect<A>) =>
		pipe(
			effect,
			(x) => {
				return effect;
			},
			isFPEffect,
			(b) =>
				b
					? FPEffectCallStrat(effect as FPEffect<A>)
					: PayloadFPEffectCallStrat(effect as PayloadFPEffect<A>),
			promiseTracker
		);
