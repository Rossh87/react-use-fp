---
layout: default
title: Testing
permalink: examples/testing
parent: Examples
nav_order: 2
---

# Testing

## Unit testing
Because action handlers written as `Reader`s accept all their dependencies as function arguments, and because they're independent of any UI components, unit testing them (or even their constituent functions) is usually dead easy.  Pass whatever mocks/spies you like, call the function, and assert on the results.  Action handlers that need to interact with browser APIs (i.e. localStorage) are a minor exception.  For these cases, it's recommended to wrap the browser API in your own interface, and pass that interface in via a `DependencyCreator`.  Then you can mock it in unit tests like any other dependency.

---

## UI testing
There are 2 main considerations for performing unit or integration tests on components that call `useFPReducer`:

1. You might want a way to 'inject' mock dependencies into your component.  Normal React mechanisms (props or Context) work fine for this.  If you have several component trees that call `useFPReducer`, and that have overlapping dependencies (e.g. an HTTP library like `axios`), it can work well to provide the dependencies from a `Context` near the root of your app.  Since these dependencies will never change, the performance impact should be next to nothing.  Then, for testing, wrap your component tree with a `Provider` of whatever mocks/stubs you need.  Module mocking at the environment level (e.g. `jest.mock`), or an intermediary like [msw](https://mswjs.io/) will also work normally.

2. If you mock asynchronous functionality in tests, you'll need a way to wait for dispatches from action handlers to finish.  [React Testing Libary](https://testing-library.com/docs/react-testing-library/intro/)'s `waitFor` and `findBy*` utilities are excellent for this.

If you're rendering UI components in a given test, it's usually preferable to assert on the generated UI rather than monitoring the component's internals.  However, if you need to know exactly what your action handlers are doing while you interact with the UI, you do have [one other option]({% link examples/subscriber.md %}).