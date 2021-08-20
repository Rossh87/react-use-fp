import {
	DependencyCreator,
	Effect,
	FPEffect,
	PayloadFPEffect,
	Action,
} from './types';

export function isPromise(a: unknown): a is Promise<any> {
	return a instanceof Promise;
}

export function isDependencyCreator<A extends Action<any>, D>(
	a: DependencyCreator<A, D> | undefined
): a is DependencyCreator<A, D> {
	return typeof a === 'function';
}

export function isFPEffect(a: Effect<any>): a is FPEffect<any> {
	return a._effectTag === 'FPReader';
}

export function isPayloadFPEffect(a: Effect<any>): a is PayloadFPEffect<any> {
	return a._effectTag === 'payloadFPReader';
}
