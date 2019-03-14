const { join } = require('path');
const { homedir } = require('os');

/**
 * RegEx to match against the Journal filename conventions used by E:D
 * @type {RegEx}
 */
const JOURNAL_FILE_REGEX = /^Journal\.\d*?\.\d*?\.log$/;

/**
 * Port to use for our WebSocket connections
 * @type {Number}
 */
const JOURNAL_SERVER_PORT = 31337;

/**
 * Path that E:D saves Journal files to
 * @type {String}
 */
const JOURNAL_DIR = join(homedir(), 'Saved Games', 'Frontier Developments', 'Elite Dangerous');

/**
 * List of ancillary files to also include in the event broadcast
 * @type {Array}
 */

const ANCILLARY_FILES = ['Cargo.json', 'Market.json', 'ModulesInfo.json', 'Outfitting.json', 'Shipyard.json', 'Status.json'];

/**
 * Default Journal Event subscription list for clients
 * @type {Array}
 */
const DEFAULT_EVENT_SUBSCRIPTIONS = ['ALL'];

/**
 * Allow subscriptions to specific events?
 * @type {Boolean}
 */
const SERVER_ALLOW_SUBSCRIPTIONS = true;

/**
 * Message Type String for registration from Client
 * @type {String}
 */
const SERVER_SUBSCRIPTION_MESSAGE_TYPE = 'subscribe';

/**
 * Zeroconf/Bonjour service name
 * @type {String}
 */
const JOURNAL_SERVER_SERVICE_NAME = 'Elite Dangerous Journal Server';

/**
 * Type of Zeroconf/Bonjour service we are publishing
 * @type {String}
 */
const JOURNAL_SERVER_SERVICE_TYPE = 'ws';

/**
 * Should Network Discovery be enabled
 * @type {Boolean}
 */
const SERVER_ALLOW_DISCOVERY = true;

/**
 * Time to pass to watcher for polling interval
 * @type {Number}
 */
const JOURNAL_WATCH_INTERVAL = 100;

/**
 * Interval to use for server heartbeat broadcast
 * @type {Number}
 * @description 1 minute
 */
const SERVER_HEARTBEAT_INTERVAL = 60000;

/**
 * Should server allow clients to Register
 * @type {Boolean}
 */
const SERVER_ALLOW_REGISTRATION = false;

/**
 * Should server force clients to Register
 * @type {Boolean}
 */
const SERVER_FORCE_REGISTRATION = false;

/**
 * Message Type String for registration from Client
 * @type {String}
 */
const SERVER_REGISTRATION_MESSAGE_TYPE = 'register';

/**
 * Error message for client requiring registration
 * @type {String}
 */
const ERROR_MUST_REGISTER_MSG = 'Client must register with Server';

/**
 * Error code client requiring registration
 * @type {Number}
 */
const ERROR_MUST_REGISTER_CODE = 401;

/**
 * Error message for invalid message types
 * @type {String}
 */
const ERROR_INVALID_MESSAGE_MSG = 'Server does not accept message type';

/**
 * Error code for invalid message types
 * @type {Number}
 */
const ERROR_INVALID_MESSAGE_CODE = 403;

/**
 * Error message for invalid message types
 * @type {String}
 */
const ERROR_INVALID_PAYLOAD_MSG = 'Server does not accept payload';

/**
 * Error code for invalid message types
 * @type {Number}
 */
const ERROR_INVALID_PAYLOAD_CODE = 400;


/**
 * Name of Journal Event that first gives us the CMDR name
 * @type {String}
 */
const EVENT_FOR_COMMANDER_NAME = 'LoadGame';

module.exports = {
  // non-configurable
  EVENT_FOR_COMMANDER_NAME,

  // errors
  ERROR_INVALID_MESSAGE_MSG,
  ERROR_INVALID_MESSAGE_CODE,
  ERROR_MUST_REGISTER_MSG,
  ERROR_MUST_REGISTER_CODE,
  ERROR_INVALID_PAYLOAD_MSG,
  ERROR_INVALID_PAYLOAD_CODE,

  // server
  JOURNAL_SERVER_PORT,

  // watcher
  JOURNAL_DIR,
  JOURNAL_FILE_REGEX,
  JOURNAL_WATCH_INTERVAL,
  ANCILLARY_FILES,

  // heartbeat
  SERVER_HEARTBEAT_INTERVAL,

  // discovery
  SERVER_ALLOW_DISCOVERY,
  JOURNAL_SERVER_SERVICE_NAME,
  JOURNAL_SERVER_SERVICE_TYPE,

  // subscriptions
  SERVER_ALLOW_SUBSCRIPTIONS,
  DEFAULT_EVENT_SUBSCRIPTIONS,
  SERVER_SUBSCRIPTION_MESSAGE_TYPE,

  // registration
  SERVER_ALLOW_REGISTRATION,
  SERVER_FORCE_REGISTRATION,
  SERVER_REGISTRATION_MESSAGE_TYPE,
};
