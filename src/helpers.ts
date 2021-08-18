import { Dispatch } from 'react';
import { fromPredicate, map, fold, fromNullable } from 'fp-ts/Option';
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
				tracker.pending += 1;
				p.then(() => {
					tracker.pending = tracker.pending - 1;
				});
			})
		);

export const makeObservableDispatch =
	<A extends Action<any>>(record: ObservedActions<A>) =>
	(matched: A['type']) =>
	(dispatch: Dispatch<A>) =>
		flow(pipe(setObserved(record)(matched), chainFirst), dispatch);

export const makeSubscribableDispatch =
	<A>(sub?: (a: A) => void) =>
	(dispatch: Dispatch<A>): Dispatch<A> =>
		pipe(
			sub,
			fromNullable,
			fold(
				() => dispatch,
				(sub) => flow(chainFirst(sub), dispatch)
			)
		);

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
	(tracker: PendingTracker) =>
	<A extends Action<any>>(state: ObservedActions<A>): Observer<A> =>
	async () => {
		let retries = 0;

		while (tracker.pending > 0) {
			if (retries < 25) {
				await delay(200);
				retries++;
			} else {
				// break the app
				throw new Error(failedToResolveMessage);
			}
		}
		return Object.assign({}, state);
	};

export const setObserved =
	<A extends Action<any>>(record: ObservedActions<A>) =>
	(matched: string) => {
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

export const filterAndSetActionTypes =
	<A>(set: Set<A>) =>
	(members: A[]) =>
		members.filter((str) => {
			if (set.has(str)) {
				return false;
			}

			set.add(str);
			return true;
		});
