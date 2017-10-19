/* eslint no-console: 0 */

const WebSocket = require('ws');

// Journal Server connection
const ws = new WebSocket('ws://localhost:31337');

ws.on('open', () => {
  // we want to subscribe
  const eventType = 'subscribe';

  // these are two easy events to see when starting up the Journal Server
  // and the Elite Dangerous game so that you don't have to work too hard to test
  // successful subscriptions
  const payload = ['Music', 'Fileheader'];

  // the server update our subscriptions
  ws.send(JSON.stringify({ type: eventType, payload }));

  // the server should return an error for it's payload
  ws.send(JSON.stringify({ testing: true }));
});

// Journal Server broadcast
ws.on('message', (data) => {
  // parse our stringified JSON
  const eventData = JSON.parse(data);

  // extract Journal payload from broadcast
  const { payload } = eventData;

  // new Journal file
  if (payload.event === 'Fileheader') {
    console.log(`${eventData.journal}`);
  // other event
  } else {
    console.log(eventData);
  }
});
