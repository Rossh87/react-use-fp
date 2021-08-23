---
layout: default
title: Adding Dependencies
permalink: examples/adding-dependencies
parent: Examples
nav_order: 1
---

# Dependencies

## Using a `DependencyCreator` function

The first call to `useFPReducer` takes an optional second argument that we'll call `dependencyCreator`.  `dependencyCreator` should have the following type (which is exported for package consumers):
```
interface DependencyCreator<A extends Action<any>, D> {
	(dispatch: Dispatch<A>): {dispatch: Dispatch<A>} & D;
}
```
where `D` is the type of a plain object that contains everything your handlers depend on beyond dispatch.

---
## Example
Imagine a React component that needs to interact with two remote APIs to handle user payments: one to verify their account balance, and another to actually send the money.  Our application defines an interface for working with each of these APIs, that look like this:
```
interface UserBankAccountService {
	approvePayment: (requestedAmount: number) => Promise<ApprovalInfo>
}

interface SecurePaymentService {
	sendPayment: (paymentData: PaymentData) => Promise<PaymentResponse>
}
```
Since these requests will be made sequentially (i.e., `sendPayment` depends on the result of `approvePayment`), it makes sense to define a single action handler that has access to them both.  To get the dependencies into our handler, we'll define a `dependencyCreator` function:
```
import {DependencyCreator} from 'react-use-fp'
import {MyActionTypes} from './path/to/actions'
import {BankServiceImplementation, PaymentServiceImplementation, UserBankAccountService, SecurePaymentService} from './services'

type Services = {
	BankService: UserBankAccountService;
	PaymentService: SecurePaymentService;
};

const createDependencies: DependencyCreator<MyActionTypes, Services> = (
	dispatch
) => ({
	dispatch,
	BankService: BankServiceImplementation,
	PaymentService: PaymentServiceImplementation,
});
```
Now, pass `createDependencies` to `useFPReducer` inside a component:
```
import React from 'react'
import {createDependencies, handlePaymentRequest} from './path/to/handler/stuff'
import {initialState, paymentReducer} from './path/to/state/stuff'

interface UserProfile {
	userID: string
}

const PaymentManager: React.FunctionComponent<UserProfile> = ({ userID }) => {
	// Note we can use other hooks for local state as well
	const [paymentAmount, setPaymentAmount] = React.useState(0);

	const [state, dispatch, actions] = useFPReducer(
		{
			INIT_PAYMENT: handlePaymentRequest,
		},
		createDependencies
	)(initialState, paymentReducer);

	const onSubmit = (e: any) => {
		e.preventDefault();
		dispatch(actions.INIT_PAYMENT(paymentAmount));
	};

	return (
		<main>
			<h1>So far you've sent: {state.alreadySent}</h1>
			<form onSubmit={onSubmit}>
				<input
					type="text"
					onChange={(e) => setPaymentAmount(e.target.value)}
				/>
				<button type="submit">Send Money!</button>
			</form>
		</main>
	);
};
```
And that's it!  Your handler will take care of the rest whenever the form is submitted.