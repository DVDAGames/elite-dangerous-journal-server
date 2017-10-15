# Elite: Dangerous Journal Server

#### Version 2.0.0

A simple WebSocket server for emiting Elite: Dangerous Journal Events.

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

## Known Issues

- [Watching stops after new Journal file is created](https://github.com/DVDAGames/elite-dangerous-journal-server/issues/1): this is 
currently under investigation

## Usage

### Getting Started

```shell
npm install --save elite-dangerous-journal-server
```

### Server

The server Class does not require any parameters, but has 3 optional ones:

- `port`: listen for socket connections on a specific port; defaults to `31337`
- `journalPath`: path to Elite: Dangerous Journal directory; defaults to
`~/Saved Games/Frontier Developments/Elite Dangerous/`
- `id`: unique identifier for this Journal Server; defaults to a generated UUID

#### Basic Server Example

```javascript
const EliteDangerousJournalServer = require('elite-dangerous-journal-server');

const JournalServer = new EliteDangerousJournalServer();

JournalServer.init();
```

#### Custom Port

```javascript
const EliteDangerousJournalServer = require('elite-dangerous-journal-server');

const port = 12345;

const JournalServer = new EliteDangerousJournalServer(port);

JournalServer.init();
```

### Client

Each connected client will listen to all events by default, but clients can choose
which Journal Events the Journal Server will broadcast to them.

The Journal Server `message` will have the following data:

- `journalServer`: \[*String*\] the UUID of the Journal Server that sent the message
- `journal`: \[*String*\] the name of the Journal file that is currently being used
- `clientID`: \[*String*\] the UUID the Journal Server has assigned to this client
- `subscribedTo`: \[*Array*\] the events that this client is subscribed to
- `commander`: \[*String*\] the currently loaded CMDR name; `null` until `LoadGame` event
- `payload`: \[*Object*\] the Journal Event that was triggered or the message from the Journal Server

**NOTE**: The `payload` property will be an empty Object when clients update subscriptions
and will be the following Object if the client sends an invalid message: `{ error: true }`.
In every other case it will contain the JSON-lines Object for that Journal Event.

#### Basic Example

```javascript
const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:31337');

socket.on('message', (data) => {
  const eventData = JSON.parse(data);

  const { payload } = eventData;

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
  const eventData = JSON.parse(data);

  const { payload } = eventData;

  console.log(`CMDR: ${payload.event}`);
});
```

## Acknowledgements

- *Elite: Dangerous* is © 1984 - 2017 Frontier Developments plc.
- [Elite: Dangerous Community Developers](https://edcd.github.io/)
- [CMDR willyb321](https://github.com/willyb321) for some direction on the issues with watching the Journal file
