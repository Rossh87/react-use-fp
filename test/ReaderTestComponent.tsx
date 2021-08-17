import React from 'react';
import { useFPReducer } from '../src/index';
import countReducer, { defaultState } from './testReducer';

interface TestProps {
	handler: any;
	makeDependencies?: any;
	payload?: number;
	subscriber?: (a: any) => void;
}

const ReaderTestComponent: React.FunctionComponent<TestProps> = ({
	handler,
	makeDependencies,
	payload,
	subscriber,
}) => {
	const [countState, countDispatch] = useFPReducer(
		defaultState,
		countReducer,
		subscriber
	)({ DO_HANDLER: handler }, makeDependencies);

	const onClick = () => countDispatch({ type: 'DO_HANDLER', payload });

	return (
		<div>
			<h1 data-testid="countDisplay">{countState.count}</h1>
			<button onClick={onClick}>clicky</button>
		</div>
	);
};

export default ReaderTestComponent;
