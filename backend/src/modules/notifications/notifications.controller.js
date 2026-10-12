const { createCrudModule } = require('../../utils/createCrudModule');
const { controller } = createCrudModule({
  table: 'notifications',
  idColumn: 'notification_id',
  resourceName: 'Notification',
});
module.exports = { controller };
