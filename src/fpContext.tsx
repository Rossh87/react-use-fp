import { useFPMiddleware } from '.';
import {
	Action,
	DependencyCreator,
	AcceptObserver,
	FPContextTools,
} from './types';
import React, { createContext, Dispatch, Reducer, useContext } from 'react';

const dummyDispatch = () =>
	console.warn(
		'Oops! FP Dispatch context was accessed outside of a Provider component'
	);

const FpTools = createContext(null);

interface ProviderProps {
	acceptObserver?: AcceptObserver;
}

export const createFPContext =
	<S, A extends Action<any>>(initState: S) =>
	(reducer: Reducer<S, A>) => {
		const WithFP: React.FunctionComponent<ProviderProps> = ({
			acceptObserver,
			children,
		}) => {
			console.log('context component rendered!!');
			const tools = useFPMiddleware(reducer, initState, acceptObserver);

			return (
				<FpTools.Provider value={tools}>{children}</FpTools.Provider>
			);
		};

		return WithFP;
	};

export const useFPContext = <S, A extends Action<any>, T = undefined>() =>
	useContext(FpTools) as FPContextTools<S, A, T>;
