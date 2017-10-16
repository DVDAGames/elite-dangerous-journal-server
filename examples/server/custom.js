const uuid = require('uuid/v5');

const EliteDangerousJournalServer = require('../../index.js');

const UUID_NAMESPACE = 'ws://journalserver.dvdagames.com/';

const port = 12345;
const serviceName = 'Example Elite: Dangerous Journal Server';
const id = uuid(UUID_NAMESPACE, uuid.URL);
const headers = {
  TESTING: true,
};
const interval = 1000;

const config = {
  port,
  serviceName,
  id,
  headers,
  interval,
};

const JournalServer = new EliteDangerousJournalServer(config);

JournalServer.init();
