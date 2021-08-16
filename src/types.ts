import { Dispatch, ReducerAction, Reducer } from 'react';
import { Reader } from 'fp-ts/Reader';
import { Task } from 'fp-ts/lib/Task';
import { IO } from 'fp-ts/lib/IO';

export interface Action<T> {
	type: string;
	payload?: T;
}

// init stuff
type GetDependencyType<A, D> = D extends (...args: any[]) => infer R
	? R
	: Dispatch<A>;

// We need a union with Record type to satisfy fp-ts
export type ActionMap<
	S,
	A extends { type: string; payload?: any },
	D extends DependencyCreator<A> = DependencyCreator<A>
> = {
	[key in ReducerAction<Reducer<S, A>>['type']]?: HandlerKinds<
		A,
		GetDependencyType<A, D>,
		A['payload']
	>;
} &
	Record<string, any>;

// // dependency stuff
export type DependencyType = 'dispatch' | 'product';

interface DispatchDependency<A> {
	dispatch: Dispatch<A>;
}

export interface ProductDependencies<A> extends DispatchDependency<A> {}

export interface DependencyCreator<A> {
	(dispatch: Dispatch<A>): ProductDependencies<A>;
}

export type HandlerDependencies<A> = Dispatch<A> | ProductDependencies<A>;

// handler stuff
export type ReaderResult = Task<any> | IO<any>;

export type DispatchDependencyReader<A> = Reader<Dispatch<A>, ReaderResult>;

export type PayloadDispatchDependencyReader<A, T> = (
	t: T
) => Reader<Dispatch<A>, ReaderResult>;

export type ProductDependencyReader<D> = Reader<D, ReaderResult>;

export type PayloadProductDependencyReader<D, T> = (
	t: T
) => Reader<D, ReaderResult>;

export type HandlerKinds<A, D, T> =
	| DispatchDependencyReader<A>
	| PayloadDispatchDependencyReader<A, T>
	| ProductDependencyReader<D>
	| PayloadProductDependencyReader<D, T>;

// receiver stuff
export type EffectKinds =
	| 'dispatchDependency'
	| 'productDependency'
	| 'payloadDispatchDependency'
	| 'payloadProductDependency';

export interface Effect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> {
	_effectTag: EffectKinds;
	type: A['type'];
	handler: HandlerKinds<A, D, T>;
	dependencies: HandlerDependencies<A>;
	payload: A['payload'];
	createDependencies: DependencyCreator<A> | undefined;
}

export type PreEffect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> = Pick<Effect<A, D, T>, 'type' | 'handler' | 'createDependencies'>;

export interface DispatchDependencyEffect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> extends Effect<A, D, T> {
	_effectTag: 'dispatchDependency';
	handler: DispatchDependencyReader<A>;
	dependencies: Dispatch<A>;
}

export interface PayloadDispatchDependencyEffect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> extends Effect<A, D, T> {
	_effectTag: 'payloadDispatchDependency';
	handler: PayloadDispatchDependencyReader<A, T>;
	dependencies: Dispatch<A>;
}

export interface ProductDependencyEffect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> extends Effect<A, D, T> {
	_effectTag: 'productDependency';
	handler: ProductDependencyReader<D>;
	dependencies: D;
}

export interface PayloadProductDependencyEffect<
	A extends Action<any>,
	D extends HandlerDependencies<A>,
	T
> extends Effect<A, D, T> {
	_effectTag: 'payloadProductDependency';
	handler: PayloadProductDependencyReader<D, T>;
	dependencies: D;
}

// observer stuff
export interface ObservedActions<A> extends Record<string, TakenActions<A>> {}

export type TakenActions<A> = Array<A>;

export interface Observer<T = any> {
	(): Promise<ObservedActions<T>>;
}

export interface AcceptObserver<T = any> {
	(a: Observer<T>): any;
}
export interface PendingTracker {
	pending: number;
}

// plumbing stuff
export interface ComposableMiddleware<A extends Action<any>> {
	(dispatch: Dispatch<A>): (next: Dispatch<A>) => (action: A) => void;
}

export type FPContextTools<S, A extends Action<any>, T = any> = [
	S,
	Dispatch<A>,
	(
		a: A['type']
	) => (
		b: HandlerKinds<A, HandlerDependencies<A>, T>,
		c?: DependencyCreator<A>
	) => void
];
