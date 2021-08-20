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
	: DispatchDependency<A>;

export interface ActionMap extends Record<string, any> {}

// // dependency stuff
export interface DispatchDependency<A> {
	dispatch: Dispatch<A>;
}

export type ReaderDependencies<A, D> = DispatchDependency<A> & D;

export interface DependencyCreator<A extends Action<any>, D> {
	(dispatch: Dispatch<A>): DispatchDependency<A> &
		{ [key in keyof D]: D[key] };
}

// handler stuff
export type ReaderResult = Task<any> | IO<any>;

export type FPReader<A, D = {}> = Reader<
	ReaderDependencies<A, D>,
	ReaderResult
>;

export type PayloadFPReader<A, T, D = {}> = (payload: T) => FPReader<A, D>;

export type Handler<A, T, D> = PayloadFPReader<A, T, D> | FPReader<A, D>;

// receiver stuff
export type EffectKinds = 'payloadFPReader' | 'FPReader';

export type EffectHandlers<A, T, D> = FPReader<A, D> | PayloadFPReader<A, T, D>;

export interface Effect<A extends Action<any>, T = any, D = {}> {
	_effectTag: EffectKinds;
	type: A['type'];
	handler: EffectHandlers<A, T, D>;
	dependencies: ReaderDependencies<A, D>;
	payload: A['payload'];
	createDependencies?: DependencyCreator<A, D>;
}

export type PreEffect<A extends Action<any>> = Pick<
	Effect<A>,
	'type' | 'handler' | 'createDependencies'
>;

export interface FPEffect<A extends Action<any>, T = any, D = {}>
	extends Effect<A, T, D> {
	_effectTag: 'FPReader';
	handler: FPReader<A, D>;
	dependencies: ReaderDependencies<A, D>;
}

export interface PayloadFPEffect<A extends Action<any>, T = any, D = {}>
	extends Effect<A, T, D> {
	_effectTag: 'payloadFPReader';
	handler: PayloadFPReader<A, T, D>;
	dependencies: ReaderDependencies<A, D>;
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

// mutable state for handlers
export interface ExecutionState {
	dispatch: Dispatch<any>;
	handlers: ComposableMiddleware<any>[];
	observed: ObservedActions<any>;
	pendingPromises: PendingTracker;
	isFirstRun: boolean;
}

// utility types
type ExtractPayloadType<T> = T extends PayloadFPReader<any, infer P, any>
	? P
	: undefined;

type ActionCreators<T> = {
	[K in keyof T]: (p: ExtractPayloadType<T[K]>) => {
		type: K;
		payload: ExtractPayloadType<T[K]>;
	};
};
