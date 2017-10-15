const EliteDangerousJournalServer = require('../../index.js');

const JOURNAL_SERVER_PORT = 12123;

const JournalServer = new EliteDangerousJournalServer(JOURNAL_SERVER_PORT);

JournalServer.init();
