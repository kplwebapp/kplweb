const roles = require('./roles');
const permissions = require('./permissions');

module.exports = { ...roles, ...permissions };
