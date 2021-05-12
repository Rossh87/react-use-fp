import React, { Reducer } from 'react';

interface ReducerState {
	count: number;
}
interface Action<T> {
	type: string;
	payload?: T;
}

export interface SetCountAction extends Action<number> {
	type: 'SET_COUNT';
}

export interface InitSetCountAction extends Action<undefined> {
	type: 'DO_HANDLER';
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
