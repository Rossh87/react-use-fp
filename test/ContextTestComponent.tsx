import React, { Dispatch, Children, cloneElement } from 'react';
import makeFPContext from '../src/fpContext';
import { AcceptObserver } from '../src/types';
import { CountAction, ReducerState } from './testReducer';
import { useDispatch, useState, Provider } from './testContext';

interface TestProps {
	handler?: any;
	makeDependencies?: any;
	payload?: number;
	acceptObserver?: AcceptObserver;
}

type WrapperProps = {
	[key: string]: any;
};

export const ProviderWrapper: React.FunctionComponent<WrapperProps> = ({
	children,
	...rest
}) => {
	return (
		<Provider>
			{Children.map(children, (child) => {
				if (!React.isValidElement(child)) {
					return child;
				}

				return cloneElement(child, { ...rest });
			})}
		</Provider>
	);
};

export const ContextTest: React.FunctionComponent<TestProps> = ({
	handler,
	makeDependencies,
	payload,
}) => {
	const dispatch = useDispatch();
	const state = useState();

	const onClick = () => dispatch({ type: 'DO_HANDLER', payload });

	return (
		<div>
			<h1 data-testid="countDisplay">{state.count}</h1>
			<button onClick={onClick}>clicky</button>
		</div>
	);
};
