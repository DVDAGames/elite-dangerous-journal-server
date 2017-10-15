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

## Usage

### Getting Started

```shell
npm install --save elite-dangerous-journal-server
```

### Server

```javascript
const EliteDangerousJournalServer = require('elite-dangerous-journal-server');

const JournalServer = new EliteDangerousJournalServer();

JournalServer.init();
```

### Client

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

#### Subscribing to Specific Events

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
