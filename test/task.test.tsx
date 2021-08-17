import React, { Dispatch } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { Reader } from 'fp-ts/lib/Reader';
import { Task } from 'fp-ts/lib/Task';
import { CountAction } from './testReducer';
import { AcceptObserver, DependencyCreator, FPReader } from '../src/types';
import { resetInternals } from '../src';
import { delay } from '../src/helpers';

beforeEach(() => resetInternals());

describe('handlers that return a Task type', () => {
	it.only('correctly sets state via reducer', async () => {
		const handler =
			({ dispatch }) =>
			() =>
				new Promise<void>((res) => {
					setTimeout(function () {
						res();
					}, 1000);
				}).then(() => {
					console.log('dispatching...');
					dispatch({ type: 'SET_COUNT', payload: 42 });
				});
		const dispatched = [];
		const subscriber = jest.fn((x) => {
			console.log('from sub:', x);
		});

		render(
			<ReaderTestComponent handler={handler} subscriber={subscriber} />
		);

		const button = screen.getByText('clicky');
		let count = screen.getByTestId('countDisplay');
		expect(count.innerHTML).toEqual('0');

		act(() => fireEvent.click(button));
		await delay(1500);
		count = await screen.findByTestId('countDisplay');

		expect(subscriber).toHaveBeenCalled();
		expect(count.innerHTML).toEqual('42');
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
					}, 1000);
				}).then(() => {
					dispatch({ type: 'SET_COUNT', payload: newCount });
				});

		let observer;

		const acceptObserver: AcceptObserver = (a) => {
			observer = a;
		};

		render(
			<ReaderTestComponent
				handler={handler}
				makeDependencies={makeDependencies}
				acceptObserver={acceptObserver}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		act(() => fireEvent.click(button));

		const a = await observer();

		console.log('observed', a);

		expect(count.innerHTML).toEqual('42');
	});

	// it('correctly uses payload from initiating action for DispatchReader', () => {
	// 	const payload: number = 42;

	// 	const payloadHandler: PayloadDispatchDependencyReader<
	// 		CountAction,
	// 		number
	// 	> = (payload) => (dispatch) => () =>
	// 		new Promise((res) => res(dispatch({ type: 'SET_COUNT', payload })));

	// 	render(<ReaderTestComponent handler={payloadHandler} payload={42} />);

	// 	const button = screen.getByText('clicky');
	// 	const count = screen.getByTestId('countDisplay');

	// 	fireEvent.click(button);

	// 	expect(count.innerHTML).toEqual('42');
	// });

	// it('correctly uses payload from initiating action for DependencyReader', () => {
	// 	interface TestDependencies {
	// 		dispatch: Dispatch<CountAction>;
	// 		toAdd: number;
	// 	}

	// 	const makeDependencies: DependencyCreator<CountAction> = (
	// 		dispatch
	// 	) => ({ dispatch, toAdd: 2 });

	// 	const payloadHandler: PayloadProductDependencyReader<
	// 		TestDependencies,
	// 		number
	// 	> =
	// 		(payload) =>
	// 		({ dispatch, toAdd }) =>
	// 		() =>
	// 			new Promise((res) =>
	// 				res(
	// 					dispatch({
	// 						type: 'SET_COUNT',
	// 						payload: toAdd + payload,
	// 					})
	// 				)
	// 			);

	// 	render(
	// 		<ReaderTestComponent
	// 			handler={payloadHandler}
	// 			payload={40}
	// 			makeDependencies={makeDependencies}
	// 		/>
	// 	);

	// 	const button = screen.getByText('clicky');
	// 	const count = screen.getByTestId('countDisplay');

	// 	fireEvent.click(button);

	// 	expect(count.innerHTML).toEqual('42');
	// });
});
