
# Elite Dangerous Journal Server

[![npm (scoped)](https://img.shields.io/npm/v/@dvdagames/elite-dangerous-journal-server.svg?style=flat-square)](https://www.npmjs.com/package/@dvdagames/elite-dangerous-journal-server)

A simple WebSocket server for emiting *Elite Dangerous* Journal Events; it includes
network discovery features so clients can easily find and connect to the server.

The basic idea of this project is to watch changes to the Journal file as the
player enjoys the game and emit every Journal update through a WebSocket to
any connected clients that would like to listen for and react to these Journal
updates.

There are example clients and servers included in the repo's [examples](https://github.com/DVDAGames/elite-dangerous-journal-server/tree/master/examples)
directory.

Currently, the server only allows the client to subscribe to specific events and
does not perform any action with other data sent by clients. In future iterations
clients should be able to retrieve specific events from the Journal, all past events,
etc. via a simple message to the Journal Server similar to the subscription message.

Clients can subscribe to any of the Journal Events described in the
[Journal Manual](https://forums.frontier.co.uk/showthread.php/275151-Commanders-log-manual-and-data-sample)
by passing the desired event names as an Array to the server. There is an example below.


## Projects

- [ED Tightbeam](https://github.com/DVDAGames/ed-tightbeam) is a work-in-progress Electron application to host a
Journal Server so that users don't have to install Node or run scripts in a Terminal.

If you're building something with `@dvdagames/elite-dangerous-journal-server` please let us know or submit a
[Pull Request](https://github.com/DVDAGames/elite-dangerous-journal-server/pulls) adding your project to this list. 


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

The server Class does not require any parameters, but can optionally accept a single parameter.

This parameter can take on two different forms:
  1. a single port `Number`
  2. a configuration `Object`

#### Configuration Object Properties

- **port**: `[Number]: 31337` listen for socket connections on a specific port; using a `0` will use `http`'s random port assignment
- **id**: `[String]: uuid()` unique identifier for this Journal Server
- **watcher**: `[Object]` config for file watcher
  - **path**: `[String]: "~/Saved Games/Frontier Developments/Elite Dangerous/"` path to *Elite Dangerous* Journal directory
  - **interval**: `[Number]: 100` what interval (in `ms`) should our watcher use for polling for Journal updates
  - **fileRegEx**: `[RegEx]: /^Journal\.\d*?\.\d*?\.log$/` what format should Journal filenames have
- **discovery**: `[Object]` config for Bonjour/Zeroconf Network Discovery
  - **enabled**: `[Boolean]: true` should network discovery be enabled
  - **serviceName**: `[String]: "Elite Dangerous Journal Server"` name for network discovery service
  - **serviceType**: `[String]: ws` type of service to publish
- **heartbeat**: `[Object]` config for heartbeat pings
  - **interval**: `[Number]: 30000` what interval (in `ms`) between heartbeat pings
- **registration**: `[Object]` config for client registration settings
  - **enabled**: `[Boolean]: false` should registration be enabled; this just means
  that clients have to provide a name that can be used to refer to the client instead of only having the UUID we generate for each client
  - **force**: `[Boolean]: false` should clients have to register before receiving any data; this supresses all Journal Server headers in message responses and broadcasts until the client has registered
  - **messageType** `[String]: "register"` what should the client use for the `type` in their message when registering
- **subscriptions**: `[Object]` config for client subscriptions settings
  - **enabled**: `[Boolean]: true` should client be able to choose what Broadcasts to receive
  - **subscribeTo**: `[Array]: ["ALL"]` what events to subscribe clients to by default; an empty Array (`[]`) will suppress all broadcasts unless subscribed to directly
  - **messageType**: `[String]: "subscribe"` what should the client use for the `type` in their message when updating subscriptions
- **errors**: `[Object]` config for error messages to client; each error is an `Object` with a `message` and status `code` property
    **mustRegister**: `[Object]` config for registration required error
      - **message**: `[String]: "Client must register with server"`
      - **code**: `[Number]: 401`
    **invalidMessage**: `[Object]` config for invalid message type error
      - **message**: `[String]: "Server does not accept message type"`
      - **code**: `[Number]: 403`
    **invalidPayload**: `[Object]` config for invalid payload error
      - **message**: `[String]: "Server does not accept payload"`
      - **code**: `[Number]: 400`
- **headers**: `[Object]` an optional Object of arbitraty headers you'd like added to the broadcast;
these properties will exist in the broadcast data outside of the `payload` property which
will contain the Journal Event


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

const config = {
  port,
  id,
  discovery: {
    serviceName,
  },
  headers,
};

const JournalServer = new EliteDangerousJournalServer(config);

JournalServer.init();
```


### Client

Each connected client will listen to all events by default, but clients can choose
which Journal Events the Journal Server will broadcast to them.

The Journal Server broadcast will have the following data:

#### Headers

- **journalServer**: `[String]` the UUID of the Journal Server that sent the message
- **serverVersion**: `[String]` the version number of the currently running Journal
Server package
- **journal**: `[String]` the name of the Journal file that is currently being used
- **clientID**: `[String]` the UUID the Journal Server has assigned to this client
- **clientName** `[String]` the name the client registered with; `null` until registered
- **subscribedTo**: `[Array]` the events that this client is subscribed to
- **commander**: `[String]` the currently loaded CMDR name; `null` until `LoadGame`
event

**NOTE**: If `registration.force` is enabled, no headers will be present in the broadcast
until the client has registered.

#### Payload

- **payload**: `[Object]` the Journal Event that was triggered or the message from
the Journal Server
  - The `payload` property will be the current Journal's header when clients's register
  or update subscriptions.
  - The `payload` property will be an Error Object like the following when there is an issue:
  ```json
  {
    payload: {
      error: true,
      message: 'Client must register with Server',
      code: 401
    }
  }
  ```
  - The `payload` property should contain the JSON-lines Object for the current Journal
  Event in all other cases


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
  const payload = ['DockingRequested', 'DockingGranted', 'Docked', 'Undocked'];

  // only subscribe to Docking Events
  ws.send(JSON.stringify({ type, payload }));
});

socket.on('message', (data) => {
  const broadcast = JSON.parse(data);

  const { payload } = broadcast;

  console.log(`Received: ${payload.event}`);
});
```


#### Network Discovery

This is more advanced topic, please see the [discovery.js example](https://github.com/DVDAGames/elite-dangerous-journal-server/blob/master/examples/client/discovery.js)
for more information on utilizing Network Discovery in your client.


## Acknowledgements

- *Elite Dangerous* is © [Frontier Developments plc](https://www.frontier.co.uk/).
- [Elite Dangerous Community Developers](https://edcd.github.io/) for documentation
and discussions
- [CMDR willyb321](https://github.com/willyb321) for direction on a few different issues,
including `fs.watch()` issues with the Journals and using Bonjour for Network Discovery
- [Frontier Forums Elite Dangerous Journal Discussion](https://forums.frontier.co.uk/showthread.php/275151-Commanders-log-manual-and-data-sample)
for providing some info about what's in these files and how they work
