import { Action, FPEffect, PayloadFPEffect } from './types';

export const FPEffectCallStrat = <A extends Action<any>>({
	handler,
	dependencies,
}: FPEffect<A>) => handler(dependencies)();

export const PayloadFPEffectCallStrat = <A extends Action<any>>({
	handler,
	dependencies,
	payload,
}: PayloadFPEffect<A>) => handler(payload)(dependencies)();
