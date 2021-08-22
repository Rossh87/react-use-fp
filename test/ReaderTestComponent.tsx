import React from 'react';
import { useFPReducer } from '../src/index';
import { FPReader } from '../src/types';
import countReducer, { CountAction, defaultState } from './testReducer';

/**The untyped nature of this component makes it fairly useless for testing type compatibility,
 * and can be flaky in certain conditions.  Future tests will be more meaningful if they DON'T
 * depend on this component.
 */

interface TestProps {
	handler?: any;
	makeDependencies?: any;
	payload?: number;
	subscriber?: (a: any) => void;
}

// We always have a second handler that doesn't change, to catch problems
// with middleware composition in main function
const nameHandler: FPReader<CountAction> =
	({ dispatch }) =>
	() => {
		dispatch({ type: 'SET_NAME', payload: 'NewName' });
	};

const ReaderTestComponent: React.FunctionComponent<TestProps> = ({
	handler,
	makeDependencies,
	payload,
	subscriber,
}) => {
	// BAD PRACTICE in the real world, ok to type like this for test
	const [countState, countDispatch] = useFPReducer<any, any>(
		{ RUN_NAME_HANDLER: nameHandler, RUN_INJECTED_HANDLER: handler },
		makeDependencies,
		subscriber
	)(defaultState, countReducer);

	const onCountClick = () =>
		countDispatch({ type: 'RUN_INJECTED_HANDLER', payload });

	// hackity hack...
	const onNameClick = () =>
		countDispatch({ type: 'RUN_NAME_HANDLER', payload: undefined });

	return (
		<div>
			<h1 data-testid="countDisplay">{countState.count}</h1>
			<button onClick={onCountClick}>clicky</button>
			<h1 data-testid="nameDisplay">{countState.name}</h1>
			<button onClick={onNameClick}>set name</button>
		</div>
	);
};

export default ReaderTestComponent;
