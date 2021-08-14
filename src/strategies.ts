import {
  PayloadDispatchDependencyEffect,
  PayloadProductDependencyEffect,
  DispatchDependencyEffect,
  ProductDependencyEffect,
  Action,
  ProductDependencies
} from './types'

export const payloadProductCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
    handler,
    payload,
    dependencies
  }: PayloadProductDependencyEffect<A, D, T>) => handler(payload)(dependencies)()

export const payloadDispatchCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
    handler,
    payload,
    dependencies
  }: PayloadDispatchDependencyEffect<A, D, T>) =>
    handler(payload)(dependencies)()

export const dispatchCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
    handler,
    dependencies
  }: DispatchDependencyEffect<A, D, T>) => handler(dependencies)()

export const productCallStrat = <
	A extends Action<any>,
	D extends ProductDependencies<A>,
	T
>({
    handler,
    dependencies
  }: ProductDependencyEffect<A, D, T>) => handler(dependencies)()
