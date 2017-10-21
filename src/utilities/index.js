const chalk = require('chalk');

const messageMap = require('./messageTypeMap.js');

module.exports = {
  formatClientName(name) {
    const clientName = name.replace(/\s\s+/g, ' ');

    return clientName.trim();
  },

  formatLog(keys = {}, template = '', messageType = 'status') {
    let message = template;
    let chalked = template;

    Object.keys(keys).forEach((key) => {
      message = message.replace(`%${key}%`, keys[key].value);

      chalked = chalked.replace(`%${key}%`, () => {
        const { type, value } = keys[key];

        return chalk[messageMap[messageType][type]](value);
      });
    });

    chalked = chalk[messageMap[messageType].default](chalked);

    return {
      template,
      chalked,
      message,
      messageType,
      keys,
    };
  },
};
