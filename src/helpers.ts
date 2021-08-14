import { Dispatch } from 'react';
import { fromPredicate, map, fold } from 'fp-ts/Option';
import { pipe, flow } from 'fp-ts/lib/function';
import { chainFirst } from 'fp-ts/lib/Identity';
import { lookup } from 'fp-ts/Record';
import { isPromise } from './guards';
import { ObservedActions, Observer, PendingTracker, Action } from './types';

// side-effectful, but contained by main function
export const makePendingPromiseTracker =
	(tracker: PendingTracker) => (maybePromise: unknown) =>
		pipe(
			maybePromise,
			fromPredicate(isPromise),
			map((p) => {
				console.log('promise tracker firing...');
				tracker.pending += 1;
				p.then(() => {
					console.log('decrementing promise tracker...');
					tracker.pending -= 1;
				});
			})
		);

export const makeObservableDispatch =
	<A extends Action<any>>(record: ObservedActions<A>) =>
	(matched: A['type']) =>
	(dispatch: Dispatch<A>) =>
		flow(pipe(setObserved(record)(matched), chainFirst), dispatch);

export const delay = (waitTime: number): Promise<NodeJS.Timeout> =>
	new Promise((res) => {
		const id = setTimeout(function () {
			res(id);
		}, waitTime);
	});

const failedToResolveMessage =
	'react-use-fp: attempt to observe execution state \n failed because a promise inside of a handler failed to resolve.  Check other logs for \n unhandled rejections';

// The observer should always wait until there are no more pending promises from dispatch
// before it reads the state.
// TODO: this COULD be buggy with multiple handlers initiating promises in sequence, esp.
// if tests are waiting on live API calls that may take a while...
export const makeObserver =
	({ pending }: PendingTracker) =>
	<A extends Action<any>>(state: ObservedActions<A>): Observer<A> =>
	async () => {
		let retries = 0;

		while (pending > 0) {
			console.log('retrying with pending set to: ', pending);
			if (retries < 25) {
				await delay(200);
				retries++;
			} else {
				// break the app
				throw new Error(failedToResolveMessage);
			}
		}
		console.log('no more pending, returning observed value:', state);
		return state;
	};

export const setObserved =
	<A extends Action<any>>(record: ObservedActions<A>) =>
	(matched: string) => {
		console.log(`matched ${matched}`);
		console.log('record state is', record);
		return pipe(
			record,
			lookup(matched),
			fold(
				() => (action: A) => {
					record[matched] = [action];
				},
				(preexisting) => (action: A) => {
					record[matched] = [...preexisting, action];
				}
			)
		);
	};
