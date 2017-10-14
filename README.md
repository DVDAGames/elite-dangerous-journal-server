# Elite: Dangerous Journal Server

A simple WebSocket server for emiting Elite: Dangerous Journal Events.

The basic idea of this project is to watch changes to the Journal file as the
player enjoys the game and emit every Journal update through a WebSocket to
any connected clients that would like to listen for and react to these Journal
updates.

There is an example client included in the repo's [examples](tree/master/examples/)
directory.

Currently, the server does not respond to any data sent by clients, but in future iterations
clients should be able to retrieve specific events from the Journal, all past events, etc.
via a simple message to the Journal Server.

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

```javascript
const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:31337');

socket.on('message', (data) => {
  const eventData = JSON.parse(data);

  if (eventData.event === 'Fileheader') {
    console.log(`${eventData.timestamp} part ${eventData.part}`);
  } else {
    console.log(`${eventData.event} triggered`);
  }
});
```

## Acknowledgements

- *Elite: Dangerous* is © 1984 - 2017 Frontier Developments plc.
- [Elite: Dangerous Community Developers](https://edcd.github.io/)
- [CMDR willyb321](https://github.com/willyb321) for some direction on the issues with watching the Journal file
