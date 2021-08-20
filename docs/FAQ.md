---
layout: default
title: FAQ
permalink: faq
nav_order: 4
---

# FAQ

- **Q: Do I really need fp-ts in my React project?**<br>
A: Like [React Redux](https://react-redux.js.org/), [Redux-Saga](https://redux-saga.js.org/), [Immer](https://immerjs.github.io/immer/), etc., if you're not sure if you need them, you probably don't.  But, when you *do* need it, it's awfully nice to already know it!  Particularly if your application needs to manipulate data in complicated ways, functional approaches have a lot to offer.

- **Q: This seems a lot like Redux.  Can I use this with Redux?**<br>
A: Not yet, but stay tuned!

- **Q: How typesafe is the `dispatch` returned from `useFPReducer`?**<br>
A: Not completely, yet.  The compiler will warn you if you try to dispatch an action with a `type` that's not in your reducer (assuming you've typed the reducer correctly), but it will *not* warn you if you try to give it a payload of the wrong type.  In the near future, `useFPReducer` will automatically generate action-creator functions for you [Redux Toolkit](https://redux-toolkit.js.org/)-style, and they should be 100% typesafe.

- **Q: None of this makes any sense, what should I do?**<br>
A: I'm sure the fault is mine, please feel free to [open an issue](https://github.com/Rossh87/react-use-fp/issues)!  Suggestions/PRs/comments also welcome.