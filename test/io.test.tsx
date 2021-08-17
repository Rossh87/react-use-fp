import React, { Dispatch } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { CountAction } from './testReducer';
import {
	AcceptObserver,
	DependencyCreator,
	FPReader,
	PayloadFPReader,
} from '../src/types';
import { resetInternals } from '../src/index';

beforeEach(() => {
	resetInternals();
});

describe('handlers that return an IO type', () => {
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
		const makeDependencies: DependencyCreator<CountAction> = (
			dispatch
		) => ({ dispatch, newCount: 42 });

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

	it('correctly uses payload from initiating action for DispatchReader', async () => {
		const payload: number = 42;

		let observer;

		const acceptObserver: AcceptObserver = (a) => {
			observer = a;
		};

		const payloadHandler: PayloadFPReader<CountAction, number> =
			(payload) =>
			({ dispatch }) =>
			() => {
				dispatch({ type: 'SET_COUNT', payload });
			};

		render(
			<ReaderTestComponent
				handler={payloadHandler}
				payload={42}
				acceptObserver={acceptObserver}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		const res = await observer();

		console.log('observed from test:', res);
		expect(count.innerHTML).toEqual('42');
	});

	it('correctly uses payload from initiating action for DependencyReader', () => {
		interface PayloadTestDependencies {
			dispatch: Dispatch<CountAction>;
			toAdd: number;
		}

		const makeDependencies: DependencyCreator<CountAction> = (
			dispatch
		) => ({ dispatch, toAdd: 2 });

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
