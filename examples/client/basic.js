/* eslint no-console: 0 */

const WebSocket = require('ws');

// Journal Server connection
const ws = new WebSocket('ws://localhost:31337');

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
