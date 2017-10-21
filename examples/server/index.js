const EliteDangerousJournalServer = require('../../src/index.js');

const config = {
  registration: {
    enabled: true,
  },
};

const JournalServer = new EliteDangerousJournalServer(config);

JournalServer.init();
