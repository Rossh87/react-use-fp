import React, { Dispatch } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { CountAction } from './testReducer';
import {
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
		const makeDependencies: DependencyCreator<{ newCount: number }> = (
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

	it('correctly uses payload from initiating action for DependencyReader', () => {
		const payload = 40;

		interface PayloadTestDependencies {
			dispatch: Dispatch<CountAction>;
			toAdd: number;
		}

		const makeDependencies: DependencyCreator<PayloadTestDependencies> = (
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
				payload={payload}
				makeDependencies={makeDependencies}
			/>
		);

		const button = screen.getByText('clicky');
		const count = screen.getByTestId('countDisplay');

		fireEvent.click(button);

		expect(count.innerHTML).toEqual('42');
	});
});
