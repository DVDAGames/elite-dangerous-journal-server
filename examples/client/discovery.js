/* eslint no-console: 0 */

const WebSocket = require('ws');
const zeroconf = require('bonjour')();

// name for the service we want to discover
const SERVICE_NAME = 'Elite Dangerous Journal Server';

// initialize variable to hold our WebSocket
let socket;

console.log(`Searching for ${SERVICE_NAME}...`);

// search for WebSocket services
const discovery = zeroconf.find({ type: 'ws' });

// if our service goes down
discovery.on('down', (server) => {
  console.log(`Disconnected from Journal Server ${server.txt.id}`);

  // kill socket connection
  socket.close();
});

// when our service comes up
discovery.on('up', (server) => {
  // check to see if this is the serivce we are loking for
  if (server.name === SERVICE_NAME) {
    // get relevant info from Service
    const {
      addresses,
      type,
      port,
      txt: {
        id,
      },
    } = server;

    // we're going to want to connect via ipv4 for this one
    const ipv4RegEx = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

    // initialize variable to store correct address
    let validAddress;

    // iterate through addresses (ipv6 and ipv4)
    addresses.some((address) => {
      // check to see if we have an ipv4 address
      if (ipv4RegEx.test(address)) {
        // save ipv4 address
        validAddress = address;

        // break out of Array.some()
        return true;
      }

      // continue execution
      return false;
    });

    // if we found a valid address
    if (validAddress) {
      // create our socket connection
      socket = new WebSocket(`${type}://${validAddress}:${port}`);

      // catch socket error
      socket.on('error', () => {
        console.log('Journal Server WebSocket Error');
      });

      // once we have successfully connected to our Journal Server
      socket.on('open', () => {
        console.log(`Connected to Journal Server ${id}`);
      });

      // Journal Server broadcast
      socket.on('message', (data) => {
        // parse our stringified JSON
        const eventData = JSON.parse(data);

        // extract Journal payload from broadcast
        const { payload } = eventData;

        // if there was an error
        if (payload.error) {
          console.log('Journal Server Communication Error');
        }

        // new Journal file
        if (payload.event === 'Fileheader') {
          console.log(`Journal: ${eventData.journal}`);
        // other event
        } else {
          console.log(eventData);
        }
      });
    }
  }
});
