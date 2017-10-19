
## Introduction

Thanks for your interest in contributing to **Elite Dangerous Journal Server**!

We're excited to have you help out.

Every bug report, pull request, question, and suggestion is important to us.

Below you will find some information for bug reporting as well as some quick guidelines
and steps for contributing.

Be sure to check out the [Code of Conduct](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/CODE_OF_CONDUCT.md).

## Bug Reporting

Thanks for taking the time to let us know about errors you encounter. This
is a very important part of making this software better.

We really appreciate your time.

When creating an [Issue](https://github.com/DVDAGames/elite-dangerous-journal-server/issues),
please try to follow the template we've provided and provide as much detail as possible
about what was going on when the error occurred.

## Contributing Guidelines

- This project follows the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
and as long as you `npm install` you should get the necessary `eslint` dependencies for checking
your code; it's recommended to install the [eslint plugin](https://eslint.org/docs/user-guide/integrations)
for your editor
- This project makes use of [EditorConfig](http://editorconfig.org/) for consistent file conventions;
ensure you have your editor configured to work with EditorConfig
- This project follows the [semver](http://semver.org/) guidelines for versioning
- This project uses a git pre-commit hook that will prevent commits if eslint finds errors

## Development Process

**NOTE**: If this process seems like a lot, we plan to add some mock Journal data
and better ways to test the code in the future. If you get lost at any point, just
[open an issue](https://github.com/DVDAGames/elite-dangerous-journal-server/issues/new)
and we'll help walk you through it.

1. Fork this repository and clone it locally
2. `cd` into your local repo
3. Run `npm install`
4. Make your changes and commit them to your forked repo
5. Open a new Terminal window and run the following command:
```shell
node examples/client/discovery.js
```
6. Open another Terminal window and run the following command:
```shell
node examples/server/index.js
```
7. Notice the successful communication between Terminal windows
8. Fire up *Elite Dangerous* and trigger some Journal events - entering and leaving the
Galaxy Map fires `Soundtrack` events and can be done without ever leaving a station
9. Exit the client process; exit the server process
10. Run `npm run lint` to make sure there aren't any errors
11. Submit a [Pull Request](https://github.com/DVDAGames/elite-dangerous-journal-server/pulls)
and follow our PR Template
12. Accept an Internet High Five from us for helping out

![](https://media.giphy.com/media/wrzf9P70YWLJK/giphy.gif)
