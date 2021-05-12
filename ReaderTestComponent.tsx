import React, { Dispatch } from 'react';
import { useFPMiddleware } from './index';
import countReducer, { defaultState, CountAction } from './testReducer';

interface TestProps {
	handler: any;
	makeDependencies?: any;
}

const ReaderTestComponent: React.FunctionComponent<TestProps> = ({
	handler,
	makeDependencies,
}) => {
	const [countState, countDispatch, addHandler] = useFPMiddleware(
		countReducer,
		defaultState
	);

	addHandler<Dispatch<CountAction>>('DO_HANDLER')(handler, makeDependencies);

	const onClick = () => countDispatch({ type: 'DO_HANDLER' });

	return (
		<div>
			<h1 data-testid="countDisplay">{countState.count}</h1>
			<button onClick={onClick}>clicky</button>
		</div>
	);
};

export default ReaderTestComponent;
