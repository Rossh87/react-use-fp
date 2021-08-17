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

// We need a union with Record type to satisfy fp-ts
export type ActionMap<S, A extends { type: string; payload?: any }> = {
	[key in ReducerAction<Reducer<S, A>>['type']]?: Handler<A, A['payload']>;
} &
	Record<string, any>;

// // dependency stuff
interface DispatchDependency<A> {
	dispatch: Dispatch<A>;
}

export interface ReaderDependencies<A> extends DispatchDependency<A> {}

export interface DependencyCreator<A, D = {}> {
	(dispatch: Dispatch<A>): ReaderDependencies<A> & D;
}

// handler stuff
export type ReaderResult = Task<any> | IO<any>;

export type FPReader<A, D = {}> = Reader<
	ReaderDependencies<A> & D,
	ReaderResult
>;

export type PayloadFPReader<A, T, D = {}> = (payload: T) => FPReader<A, D>;

export type Handler<A, T = any> = PayloadFPReader<A, T> | FPReader<A>;

// receiver stuff
export type EffectKinds = 'payloadFPReader' | 'FPReader';

export type EffectHandlers<A, T = any> = FPReader<A> | PayloadFPReader<A, T>;

export interface Effect<A extends Action<any>> {
	_effectTag: EffectKinds;
	type: A['type'];
	handler: EffectHandlers<A, A['payload']>;
	dependencies: ReaderDependencies<A>;
	payload: A['payload'];
	createDependencies?: DependencyCreator<A>;
}

export type PreEffect<A extends Action<any>> = Pick<
	Effect<A>,
	'type' | 'handler' | 'createDependencies'
>;

export interface FPEffect<A extends Action<any>> extends Effect<A> {
	_effectTag: 'FPReader';
	handler: FPReader<A>;
	dependencies: ReaderDependencies<A>;
}

export interface PayloadFPEffect<A extends Action<any>> extends Effect<A> {
	_effectTag: 'payloadFPReader';
	handler: PayloadFPReader<A, A['payload']>;
	dependencies: ReaderDependencies<A>;
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
