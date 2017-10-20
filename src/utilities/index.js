module.exports = {
  formatClientName(name) {
    const clientName = name.replace(/\s\s+/g, ' ');

    return clientName.trim();
  },
};
