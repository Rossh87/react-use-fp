import React, { Dispatch } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { Reader } from 'fp-ts/lib/Reader';
import { IO } from 'fp-ts/lib/IO';
import { CountAction } from './testReducer';
import { AcceptObserver, Observer } from '../src/types';
import { delay } from '../src/helpers';
import ObserverTest from './ObserverTestComponent';
import { createFPContext } from '../src/fpContext';
import countReducer, { defaultState, ReducerState } from './testReducer';

describe('behavior when an observer function is passed in', () => {
	describe('when handler is a PayloadDispatchReader', () => {
		it.only('observes actions dispatched from PayloadDispatchReaders', async () => {
			const dispatched = { type: 'SET_COUNT', payload: 42 } as const;

			const handler: Reader<Dispatch<CountAction>, IO<void>> =
				(dispatch) => () => {
					console.log('handler reached!');
					dispatch(dispatched);
				};

			let observer: Observer<CountAction>;

			const setObserver: AcceptObserver = (a) => {
				observer = a;
			};

			const Provider =
				createFPContext<ReducerState, CountAction>(defaultState)(
					countReducer
				);

			render(
				<Provider acceptObserver={setObserver}>
					<ReaderTestComponent handler={handler} />
				</Provider>
			);

			const button = screen.getByText('clicky');
			const count = screen.getByTestId('countDisplay');

			await act(async () => fireEvent.click(button));

			await delay(4000);

			const deets = await observer();

			console.log(deets);

			expect(count).toBe(42);
		});

		// it('can observe multiple actions', () => {
		// 	const firstDispatched = {
		// 		type: 'SET_COUNT',
		// 		payload: 42,
		// 	} as const;
		// 	const secondDispatched = {
		// 		type: 'SET_COUNT',
		// 		payload: 20,
		// 	} as const;

		// 	let dispatchCount = 0;

		// 	const handler: Reader<Dispatch<CountAction>, IO<void>> =
		// 		(dispatch) => () => {
		// 			if (dispatchCount === 0) {
		// 				dispatch(firstDispatched);
		// 			} else {
		// 				dispatch(secondDispatched);
		// 			}

		// 			dispatchCount++;
		// 		};

		// 	const observed = [];

		// 	const observer: DispatchObserver = (a) => observed.push(a);

		// 	render(
		// 		<ReaderTestComponent observer={observer} handler={handler} />
		// 	);

		// 	const button = screen.getByText('clicky');
		// 	const count = screen.getByTestId('countDisplay');

		// 	fireEvent.click(button);
		// 	fireEvent.click(button);

		// 	console.log(observed);
		// 	expect(observed.length).toEqual(2);
		// 	expect(observed).toEqual([firstDispatched, secondDispatched]);
		// 	expect(count).toBe(20);
		// });
	});
});
