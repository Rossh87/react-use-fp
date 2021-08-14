import React, { Dispatch } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { Reader } from 'fp-ts/lib/Reader';
import { Task } from 'fp-ts/lib/Task';
import { CountAction } from './testReducer';
import {
	DependencyCreator,
	PayloadDispatchDependencyReader,
	PayloadProductDependencyReader,
} from '../src/types';

describe('handlers that return a Task type', () => {
	it('correctly sets state via reducer', () => {
		const handler: Reader<Dispatch<CountAction>, Task<void>> =
			(dispatch) => () =>
				new Promise((res) =>
					res(dispatch({ type: 'SET_COUNT', payload: 42 }))
				);

		render(<ReaderTestComponent handler={handler} />);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	it('injects dependencies correctly', () => {
		const makeDependencies: DependencyCreator<CountAction> = (
			dispatch
		) => ({ dispatch, newCount: 42 });

		const handler =
			(a: { dispatch: Dispatch<CountAction>; newCount: number }) => () =>
				new Promise((res) =>
					res(a.dispatch({ type: 'SET_COUNT', payload: a.newCount }))
				);

		render(
			<ReaderTestComponent
				handler={handler}
				makeDependencies={makeDependencies}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	it('correctly uses payload from initiating action for DispatchReader', () => {
		const payload: number = 42;

		const payloadHandler: PayloadDispatchDependencyReader<
			CountAction,
			number
		> = (payload) => (dispatch) => () =>
			new Promise((res) => res(dispatch({ type: 'SET_COUNT', payload })));

		render(<ReaderTestComponent handler={payloadHandler} payload={42} />);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	it('correctly uses payload from initiating action for DependencyReader', () => {
		interface TestDependencies {
			dispatch: Dispatch<CountAction>;
			toAdd: number;
		}

		const makeDependencies: DependencyCreator<CountAction> = (
			dispatch
		) => ({ dispatch, toAdd: 2 });

		const payloadHandler: PayloadProductDependencyReader<
			TestDependencies,
			number
		> =
			(payload) =>
			({ dispatch, toAdd }) =>
			() =>
				new Promise((res) =>
					res(
						dispatch({
							type: 'SET_COUNT',
							payload: toAdd + payload,
						})
					)
				);

		render(
			<ReaderTestComponent
				handler={payloadHandler}
				payload={40}
				makeDependencies={makeDependencies}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});
});
