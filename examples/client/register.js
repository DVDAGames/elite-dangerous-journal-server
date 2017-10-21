/* eslint no-console: 0 */

const WebSocket = require('ws');

// Journal Server connection
const socket = new WebSocket('ws://localhost:31337');

socket.on('open', () => {
  const eventType = 'register';

  const payload = {
    clientName: 'Registered Client',
    subscribeTo: ['Docked', 'Undocked'],
  };

  socket.send(JSON.stringify({ type: eventType, payload }));
});

// Journal Server broadcast
socket.on('message', (data) => {
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
