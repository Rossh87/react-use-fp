---
layout: default
title: Subscriber
permalink: examples/subscriber
parent: Examples
nav_order: 3
---

# Subscriber
`useFPReducer` optionally accepts a *third* function argument.  We'll call it a `dispatchSubscriber`.  Anytime an action handler calls `dispatch` with a given argument, `dispatchSubscriber` will be called with the same argument.  This is meant to be a patch on the fact that there is no baked-in way to monitor dispatch calls from vanilla React hooks.  Please note that `dispatchSubscriber` does **not** subscribe to the `dispatch` function that `useFPReducer` returns.  It will only be called inside of action handlers.  Please note also that, because the second and third arguments to `useFPReducer` are both functions, positionality matters.  If you would like to pass in a subscriber function, but not a `DependencyCreator` function, you will need to pass `null` as the second argument, i.e. 
```
useFPReducer({DO_THING: doerOfThing}, null, subscriber)
```