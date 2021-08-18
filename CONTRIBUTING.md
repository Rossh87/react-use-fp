# Contributing

Right now I'm interested in finding out if there's any value in this pattern for working with React and FP at the same time. Potential future improvements may include:

-   automatically converting to/from immutable data structures in the store
-   a module for Redux integration
-   a debugging mode to log what's happening in your pipelines

If you have a bug report, a question, or a suggestion, please [open an issue](https://github.com/Rossh87/react-use-fp/issues) on GitHub!

# Commit messages

Commits should begin with one of the following tags, in the format `[<tag>]: <message>`, to keep commits searchable:

-   `docs`: Any change to meta information regarding this package, including commits that update version information, commits that change JSDoc or Github site information, changes to README, etc.
-   `tooling`: Any changes to tooling that this repository uses, e.g. eslint rules, new developer dependencies, etc.
-   `api`: Changes to or expansion of the user-facing API. This includes changes to user-facing types. These changes MUST entail a semantic (major or minor) version update to package.json and a commit tag before publishing.
-   `refactor`: Internal changes that enhance code for performance, readability, etc., but do not (as far as we know) impact the end user's experience, with the possible exception of performance gains, which we presume are always desireable. For safety's sake, refactoring commits MUST entail a patch version update to package.json and a commit tag before publishing.
-   `housekeeping`: Minor cleanup/edits that don't fall into the above categories. Includes things like fixing typos that don't impact meaning, removing log/debugger statements, changing comments, etc. On its own, does not entail a version change before publishing.
