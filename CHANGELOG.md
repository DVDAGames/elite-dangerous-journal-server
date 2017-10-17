
# Changelog

Relevant new features, bugfixes, etc. for each version will be maintained here.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `.github` diretory for storing GitHub-specific files
- `.github/issue_template.md` to help with bug reporting

### Changed
- `CONTRIBUTING.md` referenced Issue template and reduced Bug Reporting verbiage;
added link to Issues page
- Added `.github` to `.npmignore` so it isn't published

## [2.4.1] - 2017-10-16
### Added
- Added `.npmignore`

### Changed
- Incrementing patch version to republish with `.npmignore` update

## [2.4.0] - 2017-10-16
### Added
- Ability to specify custom polling `interval` for Journal watcher

### Changed
- Added `CHANGELOG.md`
- Updated version in `package.json` and `README.md`

## [2.3.0] - 2017-10-16
### Added
- Ability to specify custom `headers` Object to add to broadcasts
- `pre-commit` package enforcing `npm run lint` before committing

### Changed
- Fixed ESLint errors
- Added `CONTRIBUTING.md` info
- Changed server logs to say `"broadcast"` instead of `"emit"`

## [2.2.0] - 2017-10-16
### Added
- Journal Server version number returned in broadcast headers
- Service Name for Network Discovery is now configurable

### Changed
- Better `README.md` documentation formatting
- Better organization for `examples` directory

## [2.1.0] - 2017-10-15
### Added
- Bonjour/Zeroconf for Network Discover of Journal Server
- Graceful shutdown of Journal Server

## [2.0.1] - 2017-10-15
### Changed
- Updated `README.md` with more accurate documentation

## [2.0.0] - 2017-10-14
### Added
- Allow client to subscribe to specific Journal Events

[Unreleased](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.4.1...HEAD)
[2.4.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.4.0...2.4.1)
[2.4.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.3.0...2.4.0)
[2.3.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.2.0...2.3.0)
[2.2.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.1.0...2.2.0)
[2.1.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.0.1...2.1.0)
[2.0.1](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/2.0.0...2.0.1)
[2.0.0](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/1.0.2...2.0.0)
[1.0.2](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/1.0.1...1.0.2)
[1.0.1](https://github.com/DVDAGames/elite-dangerous-journal-server/compare/53322ee...1.0.1)
