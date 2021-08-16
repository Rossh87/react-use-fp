import {
	PayloadDispatchDependencyEffect,
	PayloadProductDependencyEffect,
	DispatchDependencyEffect,
	ProductDependencyEffect,
	Action,
	ProductDependencies,
} from './types';

export const payloadProductCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
	handler,
	payload,
	dependencies,
	_effectTag,
}: PayloadProductDependencyEffect<A, D, T>) => {
	console.log('calling strat for: ', _effectTag);
	handler(payload)(dependencies)();
};

export const payloadDispatchCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
	handler,
	payload,
	dependencies,
	_effectTag,
}: PayloadDispatchDependencyEffect<A, D, T>) => {
	console.log('calling strat for: ', _effectTag);
	handler(payload)(dependencies)();
};

export const dispatchCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
	handler,
	dependencies,
	_effectTag,
}: DispatchDependencyEffect<A, D, T>) => {
	console.log('calling strat for: ', _effectTag);
	handler(dependencies)();
};

export const productCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
	handler,
	dependencies,
}: ProductDependencyEffect<A, D, T>) => handler(dependencies)();
