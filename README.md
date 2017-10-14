# ed-journal-server

A simple WebSocket server for emiting Elite: Dangerous Journal Events.

The basic idea of this project is to watch changes to the Journal file as the
player enjoys the game and emit every Journal update through a WebSocket to
any connected clients that would like to listen for and react to these Journal
updates.

There is an example client included in the repo's [examples](/tree/master/examples/)
directory.

Currently, the server does not respond to any data sent by clients.

## Example

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
