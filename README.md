
# Elite: Dangerous Journal Server

[![npm (scoped)](https://img.shields.io/npm/v/@dvdagames/elite-dangerous-journal-server.svg?style=flat-square)](https://www.npmjs.com/package/@dvdagames/elite-dangerous-journal-server)

A simple WebSocket server for emiting *Elite: Dangerous* Journal Events; it includes
network discovery features so clients can easily find and connect to the server.

The basic idea of this project is to watch changes to the Journal file as the
player enjoys the game and emit every Journal update through a WebSocket to
any connected clients that would like to listen for and react to these Journal
updates.

There is an example client included in the repo's [examples](https://github.com/DVDAGames/elite-dangerous-journal-server/tree/master/examples)
directory.

Currently, the server only allows the client to subscribe to specific events and
does not perform any action with other data sent by clients. In future iterations
clients should be able to retrieve specific events from the Journal, all past events,
etc. via a simple message to the Journal Server similar to the subscription message.

Clients can subscribe to any of the Journal Events described in the
[Journal Manual](https://forums.frontier.co.uk/showthread.php/275151-Commanders-log-manual-and-data-sample)
by passing the desired event names as an Array to the server. There is an example below.


## Contributors

Check out the [guide to contributing](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/CONTRIBUTING.md)
if you'd like to be a [contributor](https://github.com/DVDAGames/elite-dangerous-journal-server/graphs/contributors).


## Changelog

Check out the [CHANGELOG](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/CHANGELOG.md) for details.


## Usage

### Getting Started

```shell
npm install --save @dvdagames/elite-dangerous-journal-server
```

### Server

The server Class does not require any parameters, but has an optional configuration
Object:

- **port**: `Number` listen for socket connections on a specific port; defaults to `31337`
- **journalPath**: `String` path to Elite: Dangerous Journal directory; defaults to
`~/Saved Games/Frontier Developments/Elite Dangerous/`
- **id**: `String` unique identifier for this Journal Server; defaults to a generated UUID
- **serviceName**: `String` name for network discovery service; defaults to
`Elite: Dangerous Journal Server`
- **discovery**: `Boolean` should network discovery be enabled; defaults to `true`
- **headers**: `Object` an optional Object of headers you'd like added to the broadcast;
these properties will exist in the broadcast data outside of the `payload` property which
will contain the Journal Event.

**NOTE**: If only providing a `port` you can just pass the `Number` into the constructor
and don't need to provide a configuration Object.

**NOTE**: If the `headers` property contains any of the default header properties
that the Journal Server already plans to send, those headers will be overwritten by
the default headers.

#### Basic Server Example

```javascript
const EliteDangerousJournalServer = require('@dvdagames/elite-dangerous-journal-server');

const JournalServer = new EliteDangerousJournalServer();

JournalServer.init();
```

#### Custom Port

```javascript
const EliteDangerousJournalServer = require('@dvdagames/elite-dangerous-journal-server');

const port = 12345;

const JournalServer = new EliteDangerousJournalServer(port);

JournalServer.init();
```

#### Custom Config

```javascript
const EliteDangerousJournalServer = require('@dvdagames/elite-dangerous-journal-server');

const port = 12345;
const id = 'MY_UNIQUE_EDJS_ID';
const serviceName = 'My EDJS Instance';
const headers = {
  TEST: true
};

const config = { port, id, serviceName, headers };

const JournalServer = new EliteDangerousJournalServer(config);

JournalServer.init();
```

### Client

Each connected client will listen to all events by default, but clients can choose
which Journal Events the Journal Server will broadcast to them.

The Journal Server broadcast will have the following data:

- **journalServer**: `String` the UUID of the Journal Server that sent the message
- **serverVersion**: `String` the version number of the currently running Journal
Server package
- **journal**: `String` the name of the Journal file that is currently being used
- **clientID**: `String` the UUID the Journal Server has assigned to this client
- **subscribedTo**: `Array` the events that this client is subscribed to
- **commander**: `String` the currently loaded CMDR name; `null` until `LoadGame`
event
- **payload**: `Object` the Journal Event that was triggered or the message from
the Journal Server

**NOTE**: The `payload` property will be an empty Object when clients update subscriptions
and will be the following Object if the client sends an invalid message: `{ error: true }`.
In every other case it will contain the JSON-lines Object for that Journal Event.

#### Basic Example

```javascript
const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:31337');

socket.on('message', (data) => {
  const broadcast = JSON.parse(data);

  const { payload } = broadcast;

  if (payload.event === 'Fileheader') {
    console.log(`${payload.timestamp} part ${payload.part}`);
  } else {
    console.log(`${payload.event} triggered`);
  }
});
```

#### Subscribing to Specific Journal Events

```javascript
const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:31337');

socket.on('open', () => {
  const type = 'subscribe';
  const payload = ['DockingRequested', 'DockingGranted', 'Docked'];

  // only subscribe to Docking Events
  ws.send(JSON.stringify({ type, payload }));
});

socket.on('message', (data) => {
  const broadcast = JSON.parse(data);

  const { payload } = broadcast;

  console.log(`CMDR: ${payload.event}`);
});
```

#### Network Discovery

This is more advanced topic, please see the [discovery.js example](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/examples/client/discovery.js)
for more information on utilizing Network Discovery in your client.


## Acknowledgements

- *Elite: Dangerous* is © 1984 - 2017 Frontier Developments plc.
- [Elite: Dangerous Community Developers](https://edcd.github.io/) for documentation
and discussions
- [CMDR willyb321](https://github.com/willyb321) for direction on a few different issues,
including `fs.watch()` issues with the Journals and using Bonjour for Network Discovery
- [Frontier Forums Elite: Dangerous Journal Discussion](https://forums.frontier.co.uk/showthread.php/275151-Commanders-log-manual-and-data-sample)
for providing some info about what's in these files and how they work
