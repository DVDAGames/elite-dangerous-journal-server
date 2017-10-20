const constants = require('../constants');

/**
 * Default configuration Object for our constructor
 * @type {Object}
 */
module.exports = {
  port: constants.JOURNAL_SERVER_PORT,
  watcher: {
    interval: constants.JOURNAL_WATCH_INTERVAL,
    path: constants.JOURNAL_DIR,
    fileRegEx: constants.JOURNAL_FILE_REGEX,
  },
  discovery: {
    enabled: constants.SERVER_ALLOW_DISCOVERY,
    serviceType: constants.JOURNAL_SERVER_SERVICE_TYPE,
    serviceName: constants.JOURNAL_SERVER_SERVICE_NAME,
  },
  heartbeat: {
    interval: constants.SERVER_HEARTBEAT_INTERVAL,
  },
  registration: {
    enabled: constants.SERVER_ALLOW_REGISTRATION,
    force: constants.SERVER_FORCE_REGISTRATION,
    messageType: constants.SERVER_REGISTRATION_MESSAGE_TYPE,
  },
  subscriptions: {
    enabled: constants.SERVER_ALLOW_SUBSCRIPTIONS,
    subscribeTo: constants.DEFAULT_EVENT_SUBSCRIPTIONS,
    messageType: constants.SERVER_SUBSCRIPTION_MESSAGE_TYPE,
  },
  errors: {
    mustRegister: {
      message: constants.ERROR_MUST_REGISTER_MSG,
      code: constants.ERROR_MUST_REGISTER_CODE,
    },
    invalidMessage: {
      message: constants.ERROR_INVALID_MESSAGE_MSG,
      code: constants.ERROR_INVALID_MESSAGE_CODE,
    },
    invalidPayload: {
      message: constants.ERROR_INVALID_PAYLOAD_MSG,
      code: constants.ERROR_INVALID_PAYLOAD_CODE,
    },
  },
  headers: {},
};
