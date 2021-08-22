import React, { Dispatch } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { CountAction } from './testReducer';
import { DependencyCreator, FPReader, PayloadFPReader } from '../src/types';
import { resetInternals } from '../src';

beforeEach(() => resetInternals());

describe('handlers that return a Task type', () => {
	it('correctly sets state via reducer', async () => {
		const handler: FPReader<CountAction> =
			({ dispatch }) =>
			() =>
				new Promise<void>((res) => {
					setTimeout(function () {
						res();
					}, 100);
				}).then(() => {
					dispatch({ type: 'SET_COUNT', payload: 42 });
				});

		render(<ReaderTestComponent handler={handler} />);

		const button = screen.getByText('clicky');
		let count = screen.getByTestId('countDisplay');
		expect(count.innerHTML).toEqual('0');

		fireEvent.click(button);

		await waitFor(() => {
			expect(count.innerHTML).toEqual('42');
		});
	});

	it('injects dependencies correctly', async () => {
		interface Dependencies {
			dispatch: Dispatch<CountAction>;
			newCount: number;
		}

		const makeDependencies: DependencyCreator<CountAction, Dependencies> = (
			dispatch
		) => ({ dispatch, newCount: 42 });

		const handler: FPReader<CountAction, Dependencies> =
			({ dispatch, newCount }) =>
			() =>
				new Promise<void>((res) => {
					setTimeout(function () {
						res();
					}, 100);
				}).then(() => {
					dispatch({ type: 'SET_COUNT', payload: newCount });
				});

		render(
			<ReaderTestComponent
				handler={handler}
				makeDependencies={makeDependencies}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');
		expect(count.innerHTML).toBe('0');

		fireEvent.click(button);

		await waitFor(() => {
			expect(count.innerHTML).toEqual('42');
		});
	});

	it('correctly uses payload from initiating action for DispatchReader', async () => {
		const payload: number = 42;

		const payloadHandler: PayloadFPReader<CountAction, number> =
			(payload) =>
			({ dispatch }) =>
			() =>
				new Promise<void>((res) => {
					setTimeout(function () {
						res();
					}, 100);
				}).then(() => {
					dispatch({ type: 'SET_COUNT', payload });
				});

		render(
			<ReaderTestComponent handler={payloadHandler} payload={payload} />
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');
		expect(count.innerHTML).toBe('0');

		fireEvent.click(button);

		await waitFor(() => expect(count.innerHTML).toEqual('42'));
	});

	it('correctly uses payload from initiating action for DependencyReader', async () => {
		const payload = 40;

		interface Dependencies {
			toAdd: number;
		}

		const makeDependencies: DependencyCreator<CountAction, Dependencies> = (
			dispatch
		) => ({ dispatch, toAdd: 2 });

		const payloadHandler: PayloadFPReader<
			CountAction,
			number,
			ReturnType<typeof makeDependencies>
		> =
			(payload) =>
			({ dispatch, toAdd }) =>
			() =>
				new Promise<void>((res) => {
					setTimeout(function () {
						res();
					}, 100);
				}).then(() => {
					dispatch({ type: 'SET_COUNT', payload: toAdd + payload });
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
		expect(count.innerHTML).toBe('0');

		fireEvent.click(button);

		await waitFor(() => expect(count.innerHTML).toEqual('42'));
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
				Dependencies
			> = (dispatch) => ({ dispatch, toAdd: 2 });

			const payloadHandler: PayloadFPReader<
				CountAction,
				number,
				Dependencies
			> =
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

			render(
				<ReaderTestComponent
					handler={payloadHandler}
					payload={payload}
					makeDependencies={makeDependencies}
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
			await waitFor(() => expect(count.innerHTML).toEqual('42'));

			// // Assert name is STILL un-set
			expect(name.innerHTML).toEqual('OldName');

			// Act on NAME handler
			fireEvent.click(nameButton);

			// Assert name is updated.  Have to wait for this too so jest doesn't
			// check it synchronously
			expect(name.innerHTML).toEqual('NewName');
		});
	});
});
