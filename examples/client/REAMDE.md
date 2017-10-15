## Client Examples

This directory contains some basic examples of how to configure your client for
use with a Journal Server:

- [index.js](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/examples/client/index.js):
is a fairly standard client implementation for subscribing to specific Journal events
- [basic.js](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/examples/client/basic.js):
is a barebones client implementation for listening to Journal events
- [discovery.js](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/examples/client/discovery.js):
utilizes network discovery via Zeroconf/Bonjour to discover a Journal Server and
connect to it

**NOTE**: The `discover.js` example is the only one that can be run without the server
already up and running.
