import { Reducer } from 'react';

interface ReducerState {
	count: number;
	name: string;
}
interface Action<T> {
	type: string;
	payload?: T;
}

export interface SetCountAction extends Action<number> {
	type: 'SET_COUNT';
}

export interface SetNameAction extends Action<string> {
	type: 'SET_NAME';
}

export type CountAction = SetCountAction | SetNameAction;

export const defaultState: ReducerState = {
	count: 0,
	name: 'OldName',
};

const reducer: Reducer<ReducerState, CountAction> = (state, action) => {
	switch (action.type) {
		case 'SET_COUNT':
			return {
				...state,
				count: action.payload,
			};
		case 'SET_NAME':
			return {
				...state,
				name: action.payload,
			};
		default:
			return state;
	}
};

export default reducer;
