// Node imports
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');

// npm module imports
const WebSocket = require('ws');
const dir = require('node-dir');
const chokidar = require('chokidar');
const moment = require('moment');
const chalk = require('chalk');
const uuid = require('uuid/v1');
const _ = require('lodash');

/**
 * @constant JOURNAL_FILE_REGEX
 * @type {RegEx}
 * @desc RegEx to match against the Journal filename conventions used by E:D
 */
const JOURNAL_FILE_REGEX = /Journal\.\d*?\.\d*?\.log/;

/**
 * @constant JOURNAL_SERVER_PORT
 * @type {Number}
 * @desc Port to use for our WebSocket connections
 * @default
 */
const JOURNAL_SERVER_PORT = 31337;

/**
 * @constant JOURNAL_DIR
 * @type {String}
 * @desc Path that E:D saves Journal files to
 */
const JOURNAL_DIR = path.join(
  os.homedir(),
  'Saved Games',
  'Frontier Developments',
  'Elite Dangerous'
);


/**
 * @class EliteDangerousJournalServer
 * @desc Creates a WebSocket server that broadcasts Elite Dangerous Journal Events
 */
class EliteDangerousJournalServer {
  /**
   * Creates an instance of EliteDangerousJournalServer.
   * @param {Number} [port=JOURNAL_SERVER_PORT] port to use for sockets
   * @param {String} [journalPath=JOURNAL_DIR] path to watch; should be the Journal directory
   * @param {String} [id=uuid()] unique id for Journal Server
   * @memberof EliteDangerousJournalServer
   */
  constructor(port = JOURNAL_SERVER_PORT, journalPath = JOURNAL_DIR, id = uuid()) {
    // start http server to attach our socket server to
    this.httpServer = http.createServer();

    // initialize class properties
    this.id = id;
    this.port = port;
    this.journalPath = journalPath;
    this.currentLine = 0;
    this.journals = [];
    this.entries = [];
    this.currentHeader = {};
    this.clientSubscriptions = {};
  }

  /**
   * Initializes an instance of EliteDangerousJournalServer
   * @memberof EliteDangerousJournalServer
   */
  init() {
    // get the port from our initialization
    // destructuring it here just allows us to use the Object shorthand in our
    // WebSocket.Server() options below
    const { port } = this;

    // initialize WebSocket Server
    this.server = new WebSocket.Server(Object.assign({}, this.httpServer, { port }));

    console.log(`${chalk.green('Journal Server')} ${chalk.blue(this.id)} ${chalk.green('created')}`);

    console.log(`${chalk.green('Listening for Web Socket Connections on port')} ${chalk.blue(port)}`);

    // start watching our Journal directory for modifications
    this.journalWatcher = chokidar.watch(this.journalPath, {
      // because of the way E:D writes to Journals, we need to use polling
      usePolling: true,
    });

    console.log(`${chalk.green('Watching for changes to')} ${chalk.magenta(this.journalPath)}`);

    // set up our event handlers
    this.bindEvents();
  }

  /**
   * Configures event handling for EliteDangerousJournalServer instance
   * @memberof EliteDangerousJournalServer
   */
  bindEvents() {
    // listen for chokidar ready event
    this.journalWatcher.on('ready', this.watcherReady.bind(this));

    // listen for socket connection
    this.server.on('connection', this.websocketConnection.bind(this));

    // add broadcast method shorthand to this.server Object
    this.server.broadcast = this.broadcastToSocketClients.bind(this);
  }

  /**
   * Broadcasts a given message to every WebSocket Client
   * @param {any} data the message to broadcast
   * @memberof EliteDangerousJournalServer
   */
  broadcastToSocketClients(data) {
    // make sure we were given a message
    if (data) {
      // iterate through connected clients and send message to each one
      this.server.clients.forEach((client) => {
        const { readyState, journalServerUUID } = client;
        // make sure client is listening and we have a Journal Server Client ID
        if (readyState === WebSocket.OPEN && journalServerUUID) {
          if (this.clientSubscriptions[journalServerUUID].indexOf('ALL') !== -1 || this.clientSubscriptions[journalServerUUID].indexOf(data.event) !== -1) {
            client.send(this.formatDataForSocket(data, client.journalServerUUID));
          }
        }
      });
    }
  }

  /**
   * Normalizes provided data for transmission via WebSocket
   * @param {any} data the data to format for transmission
   * @returns {String}
   * @memberof EliteDangerousJournalServer
   */
  formatDataForSocket(payload, clientID) {
    // header data for Journal Server payload
    const journalServerHeaders = {
      journalServer: this.id,
      journal: path.basename(this.currentJournal),
      subscribedTo: this.clientSubscriptions[clientID],
      clientID,
    };

    // we can only send Strings so we need to stringify
    return JSON.stringify(
      Object.assign({}, journalServerHeaders, { payload })
    ).trim();
  }

  /**
   * Handles indexing Journal files and adding Watcher events
   * @memberof EliteDangerousJournalServer
   */
  watcherReady() {
    // index available Journal files
    dir.files(this.journalPath, this.indexJournals.bind(this));

    // watch for new Journal files
    this.journalWatcher.on('add', this.newJournalCreated.bind(this));

    // watch for changes to Journal files
    // because of the way content is appended by E:D we'll need to use 'raw'
    // instead of 'change'
    this.journalWatcher.on('raw', this.journalEvent.bind(this));
  }

  /**
   * Responds to creation of new Journal file
   * @param {any} journalPath the path to the new Journal file
   * @memberof EliteDangerousJournalServer
   */
  newJournalCreated(journalPath) {
    // add Journal path to start of Journals Array
    this.journals.unshift(journalPath);

    // make new Journal file the current Journal
    [this.currentJournal] = this.journals;

    // retrieve Journal entries from the Journal file
    this.getJournalContents();
  }

  /**
   * Responds to changes to Journal files
   * @param {String} event the type of event seen by chokidar
   * @param {any} filepath the path that was modified
   * @memberof EliteDangerousJournalServer
   */
  journalEvent(event, filepath) {
    // make sure we're seeing a change to our current Journal
    if (event === 'change' && filepath === this.currentJournal) {
      this.getJournalUpdate();
    } else {
      console.log(filepath);
    }
  }

  /**
   * Reads the JSON-lines conten from the Journal file and returns it as an Array
   * @returns {Array}
   * @memberof EliteDangerousJournalServer
   */
  readJournalFileContents() {
    // get the JSON-lines data from the Journal file
    // TODO: Find a better way to do this without having to read whole file
    return fs
      .readFileSync(this.journals[0], 'utf-8')
      .split('\n')
      .filter(item => item.trim())
    ;
  }

  /**
   * Responds to new content being added to a Journal file
   * @memberof EliteDangerousJournalServer
   */
  getJournalUpdate() {
    // get content Array
    const lines = this.readJournalFileContents();

    // remove entries we have already indexed
    lines.splice(0, this.currentLine);

    // get the new entries from this update
    this.getJournalEntries(lines);
  }

  /**
   * Handles listening for connections and messages from Clients
   * @param {Object} ws WebSocket Object from WebSocket Server connection
   * @memberof EliteDangerousJournalServer
   */
  websocketConnection(ws) {
    const clientID = uuid();

    ws.journalServerUUID = clientID;

    this.clientSubscriptions[clientID] = ['ALL'];

    // handle messages from the client
    ws.on('message', (data) => {
      const { type, payload } = JSON.parse(data);

      if (type === 'subscribe' && payload) {
        this.clientSubscriptions[clientID] = payload;

        // send the client their subscription data
        ws.send(this.formatDataForSocket({}, clientID));
        console.log(`${chalk.cyan('Client')} ${chalk.red(clientID)} ${chalk.cyan('updated subscription')}`);
      } else {
        ws.send(this.formatDataForSocket({ error: true }, clientID));
      }
    });

    // send the client the current header on successful connection
    ws.send(this.formatDataForSocket(this.currentHeader), clientID);

    // handle client disconnection
    ws.on('close', () => {
      // remove client subscriptions
      this.clientSubscriptions = _.omit(clientID);

      console.log(`${chalk.cyan('Client')} ${chalk.red(clientID)} ${chalk.cyan('disconnected from Web Socket.')}`);
      console.log(`${chalk.green('Total clients:')} ${chalk.blue(this.server.clients.size)}`);
    });

    console.log(`${chalk.cyan('Client')} ${chalk.red(clientID)} ${chalk.cyan('connected via Web Socket.')}`);
    console.log(`${chalk.green('Total clients:')} ${chalk.blue(this.server.clients.size)}`);
  }

  /**
   * Finds the Journals in Journal Directory and sets up the Journal Array
   * @param {Object} error error response from dir.files
   * @param {Array} files array of file paths found by dir.files
   * @memberof EliteDangerousJournalServer
   */
  indexJournals(error, files) {
    // if we can't index any files
    if (error) {
      console.log(`${chalk.red('Could not find Journals in')} ${chalk.magenta(this.journalPath)}`);
      throw error;
    }

    // filter and sort the files Array to get an Array of Journals sorted DESC by
    // creation date and Journal part
    this.journals = files
      // filter to make sure we are only looking at Journal files
      .filter(filename => JOURNAL_FILE_REGEX.test(path.basename(filename)))

      // sort by datestamp and part to make sure we have the most recent Journal
      .sort((a, b) => {
        // split Journal names so we can look at datestamp and part as necessary
        const aFilenameArray = path.basename(a).split('.');
        const bFilenameArray = path.basename(b).split('.');

        // geerate moment Objects from our datestamp for comparison
        const aDatestamp = moment(aFilenameArray[1], 'YYMMDDHHmmss');
        const bDatestamp = moment(bFilenameArray[1], 'YYMMDDHHmmss');

        // if the datestamps are the same we'll need to compare parts
        if (aDatestamp.isSame(bDatestamp)) {
          const aPart = Number(aFilenameArray[2]);
          const bPart = Number(bFilenameArray[2]);

          // sort DESC by part number
          return bPart - aPart;
        }

        // sort DESC by datestamp
        return bDatestamp.isAfter(aDatestamp);
      })
    ;

    // the first item in our Array should be our current journal
    [this.currentJournal] = this.journals;

    // retrieve content from the Journal to get header and seed our entries Array
    this.getJournalContents();

    console.log(`${chalk.green('Indexed Journals in')} ${chalk.magenta(this.journalPath)}`);
  }

  /**
   * Retrieves the header from the provided Journal content and returns headerless
   * Journal content Array
   * @param {Array} lines the content of our Journal file
   * @returns {Array}
   * @memberof EliteDangerousJournalServer
   */
  getJournalHeader(lines) {
    // remove header from the content
    this.currentHeader = JSON.parse(lines.shift(0, 1));

    // increment our line counter so we know our place in the Journal content
    this.currentLine = this.currentLine + 1;

    console.log(`${chalk.cyan('Stored new Journal header')}`);
    console.log(this.currentHeader);

    // return our headerless content
    return lines;
  }

  /**
   * Reads content of Journal file
   * @memberof EliteDangerousJournalServer
   */
  getJournalContents() {
    // get Journal content Array
    let lines = this.readJournalFileContents();

    // remove header
    lines = this.getJournalHeader(lines);

    // if this is a new Journal session, clear out previous entries
    if (this.currentHeader.part === 1) {
      this.entries = [];
    }

    // retrieve entries from the Journal content
    this.getJournalEntries(lines);
  }

  /**
   * Iterates through Journal content and adds entries
   * @param {Array} [lines=[]] array of journal content read from Journal file
   * @memberof EliteDangerousJournalServer
   */
  getJournalEntries(lines = []) {
    // iterate through JSON-lines
    lines.forEach(this.addJournalEntry.bind(this));
  }

  /**
   * Injects entries into entry Array and broadcasts them to clients
   * @param {any} entry journal entry to broadcast
   * @memberof EliteDangerousJournalServer
   */
  addJournalEntry(entry) {
    // add entry to our Array
    this.entries.push(JSON.parse(entry));

    // increment line coutner so we know where we are in the content
    this.currentLine = this.currentLine + 1;

    // broadcast entry to cleints
    this.server.broadcast(JSON.parse(entry));
  }
}

module.exports = EliteDangerousJournalServer;
