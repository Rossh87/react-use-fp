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
});
