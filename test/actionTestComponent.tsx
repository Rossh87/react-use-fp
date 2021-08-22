import React from 'react';
import { useFPReducer } from '../src/index';
import { DependencyCreator, FPReader, PayloadFPReader } from '../src/types';
import countReducer, { CountAction, defaultState } from './testReducer';
interface Dependencies {
	toAdd: number;
}

const makeDependencies: DependencyCreator<CountAction, Dependencies> = (
	dispatch
) => ({ dispatch, toAdd: 2 });

const nameHandler: FPReader<CountAction> =
	({ dispatch }) =>
	() => {
		dispatch({ type: 'SET_NAME', payload: 'NewName' });
	};

const countHandler: PayloadFPReader<CountAction, number, Dependencies> =
	(payload) =>
	({ dispatch, toAdd }) =>
	() =>
		new Promise<void>((res) => {
			setTimeout(function () {
				res();
			}, 100);
		}).then(() => {
			dispatch({
				type: 'SET_COUNT',
				payload: toAdd + payload,
			});
		});

const ActionCreatorTestComponent: React.FunctionComponent = () => {
	const [countState, countDispatch, actions] = useFPReducer(
		{ RUN_NAME_HANDLER: nameHandler, RUN_COUNT_HANDLER: countHandler },
		makeDependencies
	)(defaultState, countReducer);
	// contrived, but useful
	const [inputState, setInputState] = React.useState(0);

	const onNameClick = () => countDispatch(actions.RUN_NAME_HANDLER());

	// this is just a reset
	const onSubmit = (e) => {
		e.preventDefault();
		countDispatch(actions.RUN_COUNT_HANDLER(inputState));
		setInputState(0);
	};

	const onChange = (e) => {
		setInputState(parseInt(e.target.value, 10));
	};

	return (
		<div>
			<h1 data-testid="countDisplay">{countState.count}</h1>
			<h1 data-testid="nameDisplay">{countState.name}</h1>
			<button data-testid="nameButton" onClick={onNameClick}>
				set name
			</button>
			<form onSubmit={onSubmit}>
				<input
					value={inputState}
					data-testid="input"
					type="text"
					onChange={onChange}
				/>
				<button type="submit" data-testid="submit"></button>
			</form>
		</div>
	);
};

export default ActionCreatorTestComponent;
