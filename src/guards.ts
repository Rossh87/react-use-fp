import { DependencyCreator, Effect, FPEffect, PayloadFPEffect } from './types';

export function isPromise(a: unknown): a is Promise<any> {
	return a instanceof Promise;
}

export function isDependencyCreator<A>(
	a: DependencyCreator<A> | undefined
): a is DependencyCreator<A> {
	return typeof a === 'function';
}

export function isFPEffect(a: Effect<any>): a is FPEffect<any> {
	return a._effectTag === 'FPReader';
}

export function isPayloadFPEffect(a: Effect<any>): a is PayloadFPEffect<any> {
	return a._effectTag === 'payloadFPReader';
}
