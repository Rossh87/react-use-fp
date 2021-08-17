import React, { Dispatch } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReaderTestComponent from './ReaderTestComponent';
import { Reader } from 'fp-ts/lib/Reader';
import { IO } from 'fp-ts/lib/IO';
import { CountAction } from './testReducer';
import { AcceptObserver, Observer } from '../src/types';
import { delay } from '../src/helpers';
import { ContextTest, ProviderWrapper } from './ContextTestComponent';
import countReducer, { defaultState, ReducerState } from './testReducer';

describe('component use fpContext', () => {
	render(
		<ProviderWrapper payload={42}>
			<ContextTest />
		</ProviderWrapper>
	);

	const button = screen.getByText('clicky');
	const count = screen.getByTestId('countDisplay');

	fireEvent.click(button);

	expect(count.innerHTML).toEqual('42');
});
