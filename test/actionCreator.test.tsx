import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionCreatorTestComponent from './actionTestComponent';

/**
 * Janky AF, but component will break if we simulate typing anything but an integer.
 * Not feeling very creative.  Also bear in mind that the count handler adds
 * 2 as a means of testing dependency injection.
 */
describe('using auto-generated action creators', () => {
	it('does basic updates as expected', async () => {
		render(<ActionCreatorTestComponent />);

		const input = screen.getByTestId('input');
		const submit = screen.getByTestId('submit');
		const count = screen.getByTestId('countDisplay');

		fireEvent.change(input, { target: { value: '10' } });
		fireEvent.click(submit);

		await waitFor(() => expect(count.innerHTML).toEqual('12'));
	});

	it('works correctly through multiple handled events', async () => {
		render(<ActionCreatorTestComponent />);

		// Grab all the elements we need
		const input = screen.getByTestId('input') as HTMLInputElement;
		const submit = screen.getByTestId('submit');
		const count = screen.getByTestId('countDisplay');
		const name = screen.getByTestId('nameDisplay');
		const nameButton = screen.getByTestId('nameButton');

		expect(input.value).toBe('0');

		fireEvent.change(input, { target: { value: '10' } });
		fireEvent.click(submit);
		await waitFor(() => expect(count.innerHTML).toEqual('12'));

		expect(input.value).toBe('0');

		// // trigger a count update event and assert on it
		fireEvent.change(input, { target: { value: '10' } });
		fireEvent.click(submit);
		await waitFor(() => expect(count.innerHTML).toEqual('12'));

		// make sure name wasn't affected
		expect(name.innerHTML).toBe('OldName');

		// act on name
		fireEvent.click(nameButton);

		// assert
		expect(name.innerHTML).toBe('NewName');
	});
});
