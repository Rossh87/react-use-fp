import React, { Dispatch } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { Reader } from 'fp-ts/lib/Reader';
import { IO } from 'fp-ts/lib/IO';
import { CountAction } from './testReducer';
import { DependencyCreator } from './index';

describe('handlers that return an IO type', () => {
	it('correctly sets state via reducer', () => {
		const handler: Reader<Dispatch<CountAction>, IO<void>> =
			(dispatch) => () =>
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
			(a: { dispatch: Dispatch<CountAction>; newCount: number }) => () =>
				a.dispatch({ type: 'SET_COUNT', payload: a.newCount });

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
});
