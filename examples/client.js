const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:31337');

const test = true;

ws.on('open', () => {
  // the server should ignore this
  ws.send(JSON.stringify({ test }));
});

ws.on('message', (data) => {
  const eventData = JSON.parse(data);

  if (eventData.event === 'Fileheader') {
    console.log(`${eventData.timestamp} part ${eventData.part}`);
  } else {
    console.log(`${eventData.event} triggered`);
  }
});
