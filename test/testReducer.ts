import { Reducer } from 'react';
import { Action } from '../src/types';

export interface ReducerState {
	count: number;
}

export interface SetCountAction {
	type: 'SET_COUNT';
	payload: number;
}

export interface InitSetCountAction {
	type: 'DO_HANDLER';
	payload?: number;
}

export type CountAction = SetCountAction | InitSetCountAction;

export const defaultState: ReducerState = {
	count: 0,
};

const reducer: Reducer<ReducerState, CountAction> = (state, action) => {
	switch (action.type) {
		case 'SET_COUNT':
			return {
				...state,
				count: action.payload,
			};
		default:
			return state;
	}
};

export default reducer;
