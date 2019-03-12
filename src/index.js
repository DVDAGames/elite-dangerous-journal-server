/* eslint no-console: 0 */

// Node imports
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');

// package.json for version number and such
const packageJSON = require('../package.json');

// npm module imports
const WebSocket = require('ws');
const zeroconf = require('bonjour')();
const dir = require('node-dir');
const chokidar = require('chokidar');
const moment = require('moment');
const chalk = require('chalk');
const uuid = require('uuid/v1');
const { merge, omit, isNumber } = require('lodash');

// utilities
const { formatClientName } = require('./utilities');

// configuration
const CONFIG = require('./defaults');
const { EVENT_FOR_COMMANDER_NAME } = require('./constants');


/**
 * Creates a WebSocket server that broadcasts Elite Dangerous Journal Events
 * @class EliteDangerousJournalServer
 */
class EliteDangerousJournalServer {
  /**
   * Creates an instance of EliteDangerousJournalServer.
   * @param {Object} [config={}] Journal Server configuration
   *  @param {Number} [config.port] port to use for sockets
   *  @param {String} [config.id] unique id for Journal Server
   *  @param {Object} [config.watcher] watcher configuration
   *    @param {String} [config.watcher.path] path to watch; should be Journal directory
   *    @param {Number} [config.watcher.interval] time for polling Journal Directory
   *    @param {RegEx} [config.watcher.fileRegEx] RegEx for Journal file names
   *  @param {Object} [config.discovery] network discovery configuration
   *    @param {Boolean} [config.discovery.enabled] enable/disable network discovery
   *    @param {String} [config.discovery.serviceName] name for Bonjour service
   *    @param {String} [config.discovery.serviceType] type of service to broadcast
   *  @param {Object} [config.heartbeat] Object for configuring WebSocket heartbeat
   *    @param {Number} [config.heartbeat.interval] time between heartbeat pings
   *  @param {Object} [config.registration] Object for configuring client registration
   *    @param {Boolean} [config.registration.enabled] enable/disable registration
   *    @param {Boolean} [config.registration.force] force clients to register
   *    @param {String} [config.registration.messageType] what type of message should the
   *    client send to register
   *  @param {Object} [config.subscriptions] Object for configuring client subscriptions
   *    @param {Boolean} [config.subscriptions.enabled] enable/disable subscriptions
   *    @param {Array} [config.subscriptions.subscribeTo] Array of default events to subscribe to
   *    @param {String} [config.subscriptions.messageType] what type of message should the
   *    client send to update their subscriptions
   *  @param {Object} [config.errors] Object for configuring error responses
   *    @param {Object} [config.errors.mustRegister] Object for configuring registration error
   *      @param {String} [config.errors.mustRegister.message] error message for registration
   *      @param {String} [config.errors.mustRegister.code] error code to send
   *    @param {Object} [config.errors.invaldMessage] Object for configuring messaging error
   *      @param {String} [config.errors.invaldMessage.message] error message for messaging
   *      @param {String} [config.errors.invaldMessage.code] error code to send
   *    @param {Object} [config.errors.invaldPayload] Object for configuring payload error
   *      @param {String} [config.errors.invaldPayload.message] error message for payload
   *      @param {String} [config.errors.invaldPayload.code] error code to send
   *  @param {Object} [config.headers] custom headers to merge with our broadcast headers
   * @memberof EliteDangerousJournalServer
   */
  constructor(config = {}) {
    // if only a port was provided, create an Object we can use to merge
    const mergeConfig = (isNumber(config)) ? { port: config } : config;

    // merge provided config with default config
    this.config = merge({}, CONFIG, mergeConfig);

    // if no id was provided, generate one
    if (!this.config.id) {
      this.config.id = uuid();
    }

    // initialize class properties
    this.currentLine = 0;
    this.journals = [];
    this.entries = [];
    this.currentHeader = {};
    this.clientSubscriptions = {};
    this.commander = null;
    this.validMessageTypes = [];

    const { subscriptions, registration } = this.config;

    if (registration.force) {
      this.config.registration.enabled = true;
    }

    if (subscriptions.enabled) {
      this.validMessageTypes.push(subscriptions.messageType);
    }

    if (registration.enabled) {
      this.validMessageTypes.push(registration.messageType);
    }
  }

  /**
   * Initializes an instance of EliteDangerousJournalServer
   * @memberof EliteDangerousJournalServer
   */
  init() {
    // store start time for uptime calculations
    this.creation = moment();

    console.log(`${chalk.gray(`o7  Wecome to ${this.config.discovery.serviceName} version ${packageJSON.version}`)}`);

    // get port and id from our config
    // destructuring them here just allows us to use the Object shorthand in our
    const {
      port,
      id,
    } = this.config;

    // start http server to attach our socket server to
    this.httpServer = createServer();

    console.log(`${chalk.green('Journal Server')} ${chalk.blue(id)} ${chalk.green(`created on ${this.creation.format('YYYY-MM-DD HH:mm:ss')}`)}`);

    // initialize WebSocket Server
    this.server = new WebSocket.Server({ server: this.httpServer });

    // start listening
    this.httpServer.listen(port, this.serverListening.bind(this));
  }

  /**
   * Establishes Network Discovery after server is ready; initializes indexing
   * @memberof EliteDangerousJournalServer
   */
  serverListening() {
    // reassign port from httpServer in case user passed 0 for port number
    this.config.port = this.httpServer.address().port;

    // get port, id, serviceName, discovery, and journalPath from our config
    // destructuring them here just allows us to use the Object shorthand in our
    // WebSocket.Server() and bonjour options
    const {
      port,
      id,
      discovery,
      watcher,
      heartbeat,
    } = this.config;

    console.log(`${chalk.green('Listening for Web Socket Connections on port')} ${chalk.blue(port)}${chalk.green('...')}`);

    if (discovery.enabled) {
      // publish service for discovery
      this.discovery = zeroconf.publish({
        name: discovery.serviceName,
        type: discovery.serviceType,
        txt: { id, version: packageJSON.version },
        port,
      });

      console.log(`${chalk.green('Broadcasting service')} ${chalk.blue(discovery.serviceName)} ${chalk.green('for discovery...')}`);
    }

    // initialize our heartbeat ping interval
    setInterval(this.heartbeat.bind(this), heartbeat.interval);

    // index available Journal files
    dir.files(watcher.path, this.indexJournals.bind(this));
  }

  /**
   * Pings all clients for heartbeat response
   * @memberof EliteDangerousJournalServer
   */
  heartbeat() {
    // iterate through connected clients and send ping to each one
    this.server.clients.forEach((client) => {
      // get reference to client so we aren't mutating function argument directly
      // because eslint doesn't like that
      const socket = client;

      // get property set by our client's heartbeat
      const { isReceiving } = socket;

      // if our last heartbeat wasn't returned
      if (!isReceiving) {
        // get client id
        const { journalServerUUID } = socket;

        if (this.config.subscriptions.enabled) {
          // remove client subscriptions
          this.clientSubscriptions = omit(this.clientSubscriptions, journalServerUUID);
        }

        // terminate our socket connection
        socket.terminate();
      } else {
        // reset isReceiving so we can test the client's connection
        socket.isReceiving = false;

        // send a ping
        socket.ping('', false, true);
      }
    });
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

    // listen for process kill
    process.on('SIGINT', this.shutdown.bind(this));
  }

  validateClientStatus(client) {
    const { registration: { force } } = this.config;

    const { journalServerClientName: clientName } = client;

    return (!force) || (force && clientName);
  }

  websocketError(client, errorObject = {}, suppressHeaders = false) {
    let errorData = {
      error: true,
    };

    if (errorObject) {
      const { message, code } = errorObject;

      errorData = merge({}, errorData, { message, code });
    }

    client.send(this.formatDataForSocket(errorData, client, suppressHeaders));
  }

  /**
   * Handles listening for connections and messages from Clients
   * @param {Object} ws WebSocket Object from WebSocket Server connection
   * @memberof EliteDangerousJournalServer
   */
  websocketConnection(ws) {
    // generate id for client connection
    const clientID = uuid();

    // get refernce to socket to satisfy eslint rules about assigning to arguments
    const socket = ws;

    // get relevant configuration for subscriptions, registration, and error messaging
    const {
      subscriptions,
      registration,
      errors: {
        mustRegister,
        invalidMessage,
        invalidPayload,
      },
    } = this.config;

    // attach the clientID to the socket client
    socket.journalServerUUID = clientID;

    // set name to null until registered
    // also check to make sure client isn't already been registered
    // this could be done by the application using this Journal Server
    socket.journalServerClientName = socket.journalServerClientName || null;

    // set our heartbeat property
    socket.isReceiving = true;

    // set up ping listener
    socket.on('pong', () => {
      // we're still listening
      socket.isReceiving = true;
    });

    // handle socket errors
    socket.on('error', (err) => {
      // ignore that pesky ECONNRESET, socket will disconnect anyway, rethrow others
      if (err.code !== 'ECONNRESET') {
        throw err;
      }
    });

    // handle client disconnection
    socket.on('close', () => {
      // get client name if one exists
      const { journalServerClientName: clientName = '' } = socket;

      if (subscriptions.enabled) {
        // remove client subscriptions
        this.clientSubscriptions = omit(this.clientSubscriptions, clientID);
      }

      console.log(`${chalk.cyan('Client')} ${chalk.red(clientName || clientID)} ${chalk.cyan('disconnected from Web Socket.')}`);
      console.log(`${chalk.green('Total clients:')} ${chalk.blue(this.server.clients.size)}`);
    });

    console.log(`${chalk.cyan('Client')} ${chalk.red(clientID)} ${chalk.cyan('connected via Web Socket.')}`);
    console.log(`${chalk.green('Total clients:')} ${chalk.blue(this.server.clients.size)}`);

    // if we are allowing subscriptions or registration
    // we'll need to configure some things and listen for messages
    // otherwise we can just ignore messages from clients entirely
    if (subscriptions.enabled || registration.enabled) {
      // if subscriptions are enabled
      if (subscriptions.enabled) {
        // subscribe the client to our default broadcasts
        this.clientSubscriptions[clientID] = subscriptions.subscribeTo;
      }

      // handle messages from the client
      socket.on('message', (data) => {
        const { type, payload = {} } = JSON.parse(data);

        // make sure this is a message type we are handling
        if (this.validMessageTypes.indexOf(type) !== -1 && payload) {
          // if this is a registration message
          if (type === registration.messageType && registration.enabled) {
            // get client name and possible subscription data from payload
            const { subscribeTo = {} } = payload;

            let { clientName } = payload;

            clientName = formatClientName(clientName);

            if (clientName) {
              // add client name to socket client
              socket.journalServerClientName = clientName;

              console.log(`${chalk.cyan('Client')} ${chalk.red(clientID)} ${chalk.cyan('registered as')} ${chalk.red(clientName)}`);

              // if subscriptions are enabled and the client included a subscribeTo Array in payload
              if (subscriptions.enabled && Array.isArray(subscribeTo)) {
                // subscribe the client to desired events
                this.clientSubscriptions[clientID] = subscribeTo;

                console.log(`${chalk.cyan('Client')} ${chalk.red(clientName)} ${chalk.cyan('updated subscription')}`);
              }

              // send the client the current header
              return socket.send(this.formatDataForSocket(this.currentHeader, socket));
            }

            if (!this.validateClientStatus(socket)) {
              return this.websocketError(socket, mustRegister, true);
            }

            return this.websocketError(socket, invalidPayload, true);
          // if this is a subscription message
          } else if (type === subscriptions.messageType && subscriptions.enabled) {
            // get client name from socket if it exists
            const { journalServerClientName: clientName } = socket;

            // check client status
            if (this.validateClientStatus(socket)) {
              if (!Array.isArray(payload)) {
                return this.websocketError(socket, invalidPayload);
              }

              // update subscriptions with desired Journal Events
              this.clientSubscriptions[clientID] = payload;

              // send the client their subscription data
              socket.send(this.formatDataForSocket(this.currentHeader, socket));

              console.log(`${chalk.cyan('Client')} ${chalk.red(clientName || clientID)} ${chalk.cyan('updated subscription')}`);
            // if this client needs to register
            } else {
              // let the client know they need to register
              return this.websocketError(socket, mustRegister, true);
            }
          }
        // if this is an invalid message type
        } else {
          // let the client know this isn't a supported message type
          return this.websocketError(socket, invalidMessage);
        }

        return false;
      });

      // check client status
      if (!this.validateClientStatus(socket)) {
        // let client know they need to register
        return this.websocketError(socket, mustRegister, true);
      }

      // send the client the current header on successful connection
      return socket.send(this.formatDataForSocket(this.currentHeader, socket));
    }

    // send the client the current header on successful connection
    return socket.send(this.formatDataForSocket(this.currentHeader, socket));
  }

  /**
   * Broadcasts a given message to every WebSocket Client
   * @param {any} data the message to broadcast
   * @memberof EliteDangerousJournalServer
   */
  broadcast(data) {
    // make sure we were given a message
    if (data) {
      console.log(`${chalk.gray('Broadcasting event')} ${chalk.green(data.event)}:${chalk.yellow(data.timestamp)}`);

      const { subscriptions, registration } = this.config;

      // iterate through connected clients and send message to each one
      this.server.clients.forEach((client) => {
        // get id, name, and connection status from client
        const {
          readyState,
          journalServerUUID: clientID,
          journalServerClientName: clientName,
        } = client;

        // make sure client is listening
        if (readyState === WebSocket.OPEN) {
          // if client is registered or registration is not required
          if ((!registration.force) || (registration.force && clientName)) {
            // if subscriptions are enabled
            if (subscriptions.enabled && this.clientSubscriptions[clientID]) {
              const { subscribeTo: defaults } = subscriptions;
              // is the client subscribed to all broadcasts?
              const allSubbed = this.clientSubscriptions[clientID].indexOf(defaults) !== -1;

              // is the client subscribed to this broadcast?
              const thisSubbed = this.clientSubscriptions[clientID].indexOf(data.event) !== -1;

              // check subscription and emit event
              if ((allSubbed) || (thisSubbed)) {
                // broadcast event to the client
                client.send(this.formatDataForSocket(data, client));
              }
            // if subscriptions are disabled; always emit the event
            } else {
              client.send(this.formatDataForSocket(data, client));
            }
          }
        }
      });
    }
  }

  /**
   * Normalizes provided data for transmission via WebSocket
   * @param {any} payload the data to format for transmission
   * @param {Object} client the WebSocket client
   * @param {Boolean} [suppressHeaders=false] should we suppress our headers
   * @returns {String}
   * @memberof EliteDangerousJournalServer
   */
  formatDataForSocket(payload, client, suppressHeaders = false) {
    // get relevant data from client
    const { journalServerUUID: clientID, journalServerClientName: clientName } = client;

    // header data for Journal Server payload
    const journalServerHeaders = {
      journalServer: this.config.id,
      journal: path.basename(this.currentJournal),
      subscribedTo: this.clientSubscriptions[clientID],
      commander: this.commander,
      serverVersion: packageJSON.version,
      clientID,
      clientName,
    };

    // merge custom headers with server headers and payload
    let send;

    if (suppressHeaders) {
      send = Object.assign({}, { payload });
    } else {
      send = Object.assign({}, this.config.headers, journalServerHeaders, { payload });
    }

    // stringify so we are just sending a String to client
    return JSON.stringify(send).trim();
  }

  /**
   * Handles indexing Journal files and adding Watcher events
   * @memberof EliteDangerousJournalServer
   */
  watcherReady() {
    // watch for new Journal files
    this.journalWatcher.on('add', this.newJournalCreated.bind(this));

    // watch for changes to Journal files
    // because of the way content is appended by E:D we'll need to use 'raw'
    // instead of 'change'
    this.journalWatcher.on('raw', this.journalEvent.bind(this));

    // retrieve content from the Journal to get header and seed our entries Array
    this.getJournalContents(true);
  }

  /**
   * Responds to creation of new Journal file
   * @param {any} journalPath the path to the new Journal file
   * @memberof EliteDangerousJournalServer
   */
  newJournalCreated(journalPath) {
    const { watcher } = this.config;

    // ensure the new file was an actual Journal file
    if (watcher.fileRegEx.test(path.basename(journalPath))) {
      // reset current line position
      this.currentLine = 0;

      // stop watching old journal
      this.journalWatcher.unwatch(this.currentJournal);

      console.log(`${chalk.green('No longer broadcasting changes to')} ${chalk.magenta(this.currentJournal)}`);

      // add Journal path to start of Journals Array
      this.journals.unshift(journalPath);

      // make new Journal file the current Journal
      [this.currentJournal] = this.journals;

      // stop watching old journal
      this.journalWatcher.add(this.currentJournal);

      console.log(`${chalk.green('Now broadcasting changes to')} ${chalk.magenta(this.currentJournal)}`);

      // retrieve Journal entries from the Journal file
      this.getJournalContents();
    }
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
      console.log(`${chalk.green(`Filesystem event ${chalk.red(event)} occurred for`)} ${chalk.magenta(filepath)}`);
    }
  }

  /**
   * Reads the JSON-lines content from the Journal file and returns it as an Array
   * @returns {Array}
   * @memberof EliteDangerousJournalServer
   */
  readJournalFileContents() {
    // get the JSON-lines data from the Journal file
    // TODO: Find a better way to do this without having to read whole file
    const lines = fs.readFileSync(this.journals[0], 'utf-8').split('\n');

    return lines.filter(item => item.trim());
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
   * Finds the Journals in Journal Directory and sets up the Journal Array
   * @param {Object} error error response from dir.files
   * @param {Array} files array of file paths found by dir.files
   * @memberof EliteDangerousJournalServer
   */
  indexJournals(error, files) {
    // if we can't index any files
    if (error) {
      console.log(`${chalk.red('Could not find Journals in')} ${chalk.magenta(this.config.watcher.path)}`);
      throw error;
    }

    // get correct journal order
    this.journals = this.sortJournals(files);

    // the first item in our Array should be our current journal
    [this.currentJournal] = this.journals;

    console.log(`${chalk.green('Indexed Journals in')} ${chalk.magenta(this.config.journalPath)}`);

    // get polling interval
    const { interval, path: journalPath } = this.config.watcher;

    // start watching our Journal directory for modifications
    this.journalWatcher = chokidar.watch([journalPath, this.currentJournal], {
      // because of the way E:D writes to Journals, we need to use polling
      usePolling: true,
      interval,
    });

    console.log(`${chalk.green('Watching for changes to')} ${chalk.magenta(journalPath)}`);
    console.log(`${chalk.green('Watching for changes to')} ${chalk.magenta(this.currentJournal)}`);

    // set up our event handlers
    this.bindEvents();
  }

  /**
   * filter and sort the files Array to get an Array of Journals sorted DESC by
   * creation date and Journal part
   * @param {Array} [journals=[]] array of files found in directory
   * @returns {Array}
   * @memberof EliteDangerousJournalServer
   */
  sortJournals(journals = []) {
    const { watcher } = this.config;

    return journals
      // filter to make sure we are only looking at Journal files
      // this also has the added benefit of letting us sort the filtered Array
      // without mutating the original Array of files
      .filter(file => watcher.fileRegEx.test(path.basename(file)))
      // sort by datestamp and part to make sure we have the most recent Journal
      .sort((a, b) => {
        // split Journal names so we can look at datestamp and part as necessary
        const aFilenameArray = path.basename(a).split('.');
        const bFilenameArray = path.basename(b).split('.');

        // geerate moment Objects from our datestamp for comparison
        const aDatestamp = moment(aFilenameArray[1], 'YYMMDDHHmmss');
        const bDatestamp = moment(bFilenameArray[1], 'YYMMDDHHmmss');

        // sort DESC by datestamp
        if (bDatestamp.isAfter(aDatestamp)) {
          return 1;
        }

        return -1;
      });
  }

  /**
   * Reads content of Journal file
   * @param {Boolean} [startup=false] is this the initial index of the Journal Server?
   * @memberof EliteDangerousJournalServer
   */
  getJournalContents(startup = false) {
    // get Journal content Array
    let lines = this.readJournalFileContents();

    // make sure there was content in the file
    if (lines.length) {
      // remove header
      lines = this.getJournalHeader(lines);

      // if this is a new Journal session, clear out previous entries
      if (this.currentHeader.part === 1) {
        this.entries = [];
      }

      // retrieve entries from the Journal content
      this.getJournalEntries(lines, startup);
    }
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

    console.log(`${chalk.green('Stored new Journal header for')} ${chalk.magenta(path.basename(this.currentJournal))}`);

    // return our headerless content
    return lines;
  }

  /**
   * Iterates through Journal content and add and broadcast entries
   * @param {Array} [lines=[]] array of journal content read from Journal file
   * @param {Boolean} [mute=false] should we mute the entries
   * @memberof EliteDangerousJournalServer
   */
  getJournalEntries(lines = [], mute = false) {
    // iterate through JSON-lines
    lines.forEach((entry) => {
      // get line as Object
      const formattedEntry = JSON.parse(entry);

      // make sure we have an actual entry and not an empty line or empty Object
      if (formattedEntry) {
        // add entry to our Array
        this.entries.push(formattedEntry);

        // get commander name from the LoadGame event
        // this could run if the names are the same, but since it's just assigning
        // a value to one property in the case of one event it should be okay
        if (formattedEntry.event === EVENT_FOR_COMMANDER_NAME) {
          this.commander = formattedEntry.Commander;
        }

        // increment line coutner so we know where we are in the content
        this.currentLine = this.currentLine + 1;

        // broadcast entry to clients if we aren't supposed to mute it
        if (!mute) {
          this.broadcast(formattedEntry);
        }
      }
    });
  }

  /**
   * responds to process kill and gracefully shuts down
   * @memberof EliteDangerousJournalServer
   */
  shutdown() {
    console.log(`${chalk.red('Journal Server shutting down...')}`);

    // check to see if we need to unpublish network discovery service
    if (this.config.discovery) {
      this.shutdownWithDiscovery();
    } else {
      this.shutdownWithoutDiscovery();
    }
  }

  /**
   * unpublishes our discoverable service
   * @memberof EliteDangerousJournalServer
   */
  shutdownWithDiscovery() {
    // turn off discovery
    zeroconf.unpublishAll(() => {
      // destroy service
      zeroconf.destroy();

      console.log(`${chalk.gray('Unpublishing discovery service...')}`);

      // continue with rest of shutdown procedure
      this.shutdownWithoutDiscovery();
    });
  }

  /**
   * close server connections and exit
   * @memberof EliteDangerousJournalServer
   */
  shutdownWithoutDiscovery() {
    // destroy WebSocket Server
    this.server.close();

    console.log(`${chalk.gray('Muting Web Socket listener...')}`);

    // destroy http server
    this.httpServer.close();

    console.log(`${chalk.gray('Shutting down HTTP server...')}`);

    console.log(`${chalk.gray(`Server uptime was ${moment().diff(this.creation, 'hours')} hours`)}`);

    console.log(`${chalk.gray('Good bye.  o7')}`);

    // end execution
    process.exit();
  }
}

module.exports = EliteDangerousJournalServer;
