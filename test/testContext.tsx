import makeFPContext from '../src/fpContext';
import React, { Dispatch } from 'react';
import { AcceptObserver, PayloadFPReader } from '../src/types';
import countReducer, {
	CountAction,
	ReducerState,
	defaultState,
} from './testReducer';

const payloadHandler: PayloadFPReader<CountAction, number> =
	(payload) =>
	({ dispatch }) =>
	() => {
		dispatch({ type: 'SET_COUNT', payload });
	};

export const [useState, useDispatch, Provider] = makeFPContext(
	defaultState,
	countReducer
)({ DO_HANDLER: payloadHandler });
