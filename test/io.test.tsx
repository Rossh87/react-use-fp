import React, { Dispatch } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { CountAction } from './testReducer';
import { DependencyCreator, FPReader, PayloadFPReader } from '../src/types';
import { resetInternals } from '../src/index';
import { delay } from '../src/helpers';

beforeEach(() => {
	resetInternals();
});

describe('for handlers that return an IO type', () => {
	it('correctly sets state via reducer', () => {
		const handler: FPReader<CountAction> =
			({ dispatch }) =>
			() =>
				dispatch({ type: 'SET_COUNT', payload: 42 });

		render(<ReaderTestComponent handler={handler} />);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	it('injects dependencies correctly', () => {
		const makeDependencies: DependencyCreator<
			CountAction,
			{ newCount: number }
		> = (dispatch) => ({ dispatch, newCount: 42 });

		const handler =
			(a: { dispatch: Dispatch<CountAction>; newCount: number }) =>
			() => {
				{
					a.dispatch({ type: 'SET_COUNT', payload: a.newCount });
				}
			};

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

	it('correctly uses payload from initiating action for PayloadFPReader', async () => {
		const payload: number = 42;

		const payloadHandler: PayloadFPReader<CountAction, number> =
			(payload) =>
			({ dispatch }) =>
			() => {
				dispatch({ type: 'SET_COUNT', payload });
			};

		render(
			<ReaderTestComponent handler={payloadHandler} payload={payload} />
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	it('correctly uses payload from initiating action for PayloadFPReader', () => {
		const payload = 40;

		interface PayloadTestDependencies {
			toAdd: number;
		}

		const makeDependencies: DependencyCreator<
			CountAction,
			PayloadTestDependencies
		> = (dispatch) => ({ dispatch, toAdd: 2 });

		const payloadHandler: PayloadFPReader<
			CountAction,
			number,
			PayloadTestDependencies
		> =
			(payload) =>
			({ dispatch, toAdd }) =>
			() =>
				dispatch({
					type: 'SET_COUNT',
					payload: toAdd + payload,
				});

		render(
			<ReaderTestComponent
				handler={payloadHandler}
				payload={payload}
				makeDependencies={makeDependencies}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});

	describe('using more than one handler at a time', () => {
		it('runs second handler', () => {
			render(<ReaderTestComponent />);

			const button = screen.getByText('set name', { exact: false });
			const name = screen.getByTestId('nameDisplay');

			expect(name.innerHTML).toEqual('OldName');

			fireEvent.click(button);

			expect(name.innerHTML).toEqual('NewName');
		});

		it('runs second handler even after first has run', async () => {
			// This test is super important to make sure handlers continue working
			// correctly even through re-renders and multiple events
			const payload = 40;

			interface Dependencies {
				toAdd: number;
			}

			const makeDependencies: DependencyCreator<
				CountAction,
				{ toAdd: number }
			> = (dispatch) => ({ dispatch, toAdd: 2 });

			const countHandler: PayloadFPReader<
				CountAction,
				number,
				Dependencies
			> =
				(payload) =>
				({ dispatch, toAdd }) =>
				() => {
					{
						dispatch({
							type: 'SET_COUNT',
							payload: payload + toAdd,
						});
					}
				};

			render(
				<ReaderTestComponent
					handler={countHandler}
					makeDependencies={makeDependencies}
					payload={payload}
				/>
			);

			// Grab UI elements
			const countButton = screen.getByText('clicky');
			const count = screen.getByTestId('countDisplay');
			const nameButton = screen.getByText('set name', { exact: false });
			const name = screen.getByTestId('nameDisplay');

			// Assert all is un-set
			expect(count.innerHTML).toEqual('0');
			expect(name.innerHTML).toEqual('OldName');

			// Act on count handler
			fireEvent.click(countButton);

			// Assert count updated correclty
			expect(count.innerHTML).toEqual('42');

			await delay(1000);

			// Assert name is STILL un-set
			expect(name.innerHTML).toEqual('OldName');

			// Act on NAME handler
			fireEvent.click(nameButton);

			// Assert name is updated
			expect(name.innerHTML).toEqual('NewName');
		});
	});
});
