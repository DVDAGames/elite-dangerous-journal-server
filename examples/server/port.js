const EliteDangerousJournalServer = require('../../src/index.js');

const JOURNAL_SERVER_PORT = 0; // should generate a random port

const JournalServer = new EliteDangerousJournalServer(JOURNAL_SERVER_PORT);

JournalServer.init();
