import React, { Dispatch } from 'react';
import { useFPContext } from '../src/fpContext';
import { AcceptObserver } from '../src/types';
import { CountAction, ReducerState } from './testReducer';

interface TestProps {
	handler: any;
	makeDependencies?: any;
	payload?: number;
	acceptObserver?: AcceptObserver;
}

const ObserverTest: React.FunctionComponent<TestProps> = ({
	handler,
	makeDependencies,
	payload,
}) => {
	const [state, dispatch, withDispatch] =
		useFPContext<ReducerState, CountAction>();

	console.log('observer test call');

	withDispatch('DO_HANDLER')(handler, makeDependencies);

	const onClick = () => dispatch({ type: 'DO_HANDLER', payload });

	return (
		<div>
			<h1 data-testid="countDisplay">{state.count}</h1>
			<button onClick={onClick}>clicky</button>
		</div>
	);
};

export default ObserverTest;
