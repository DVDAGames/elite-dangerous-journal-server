const WebSocket = require('ws');

// Journal Server connection
const ws = new WebSocket('ws://localhost:31337');

// once we have successfully connect to our Journal Server
ws.on('open', () => {
  // we want to subscribe
  const type = 'subscribe';

  // these are two easy events to see when starting up the Journal Server
  // and the Elite: Dangerous game so that you don't have to work too hard to test
  // successful subscriptions
  const payload = ['Music', 'Fileheader'];

  // the server update our subscriptions
  ws.send(JSON.stringify({ type, payload }));

  // the server should return an error for it's payload
  ws.send(JSON.stringify({ testing: true }));
});

// Journal Server broadcast
ws.on('message', (data) => {
  // parse our stringified JSON
  const eventData = JSON.parse(data);

  // extract Journal payload from broadcast
  const { payload } = eventData;

  // if there was an error
  if (payload.error) {
    console.log('Journal Server Communication Error');

    return false;
  }

  // new Journal file
  if (payload.event === 'Fileheader') {
    console.log(`Journal: ${eventData.journal}`);
  // other event
  } else {
    console.log(eventData);
  }
});
