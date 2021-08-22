import { Action, FPEffect, PayloadFPEffect } from './types';

export const FPEffectCallStrat = <A extends Action<any>>({
	handler,
	dependencies,
}: FPEffect<A>) => {
	console.log('calling fp effect');
	handler(dependencies)();
};

export const PayloadFPEffectCallStrat = <A extends Action<any>>({
	handler,
	dependencies,
	payload,
}: PayloadFPEffect<A>) => {
	console.log('in payload strat...');
	console.log('type of disp is:', typeof dependencies.dispatch);
	handler(payload)(dependencies)();
};
