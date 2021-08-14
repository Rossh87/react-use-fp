import {
	DependencyCreator,
	DispatchDependencyEffect,
	Effect,
	PayloadDispatchDependencyEffect,
	PayloadProductDependencyEffect,
	ProductDependencyEffect,
} from './types';

export function isPromise(a: unknown): a is Promise<any> {
	return a instanceof Promise;
}

export function isDependencyCreator<A>(
	a: DependencyCreator<A> | undefined
): a is DependencyCreator<A> {
	return typeof a === 'function';
}

export function isDispatchDependency(
	a: Effect<any, any, any>
): a is DispatchDependencyEffect<any, any, any> {
	return a._effectTag === 'dispatchDependency';
}

export function isProductDependency(
	a: Effect<any, any, any>
): a is ProductDependencyEffect<any, any, any> {
	return a._effectTag === 'productDependency';
}

export function isPayloadProductDependency(
	a: Effect<any, any, any>
): a is PayloadProductDependencyEffect<any, any, any> {
	return a._effectTag === 'payloadProductDependency';
}

export function isPayloadDispatchDependency(
	a: Effect<any, any, any>
): a is PayloadDispatchDependencyEffect<any, any, any> {
	return a._effectTag === 'payloadDispatchDependency';
}
