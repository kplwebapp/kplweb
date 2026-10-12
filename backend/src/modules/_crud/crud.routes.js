const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const { createCrudModule } = require('../../utils/createCrudModule');

const moduleConfigs = [
  { path: 'players', table: 'players', idColumn: 'player_id', permission: PERMISSIONS.PLAYERS_READ },
  { path: 'tournaments', table: 'tournaments', idColumn: 'tournament_id', permission: PERMISSIONS.TOURNAMENTS_READ },
  { path: 'matches', table: 'matches', idColumn: 'match_id', permission: PERMISSIONS.MATCHES_READ },
];

const buildCrudRouter = (config) => {
  const { controller } = createCrudModule({
    table: config.table,
    idColumn: config.idColumn,
    resourceName: config.path,
  });
  const router = Router();
  router.get('/', authenticate, authorize(config.permission), controller.list);
  router.get('/:id', authenticate, authorize(config.permission), controller.getById);
  return router;
};

const playersRoutes = buildCrudRouter(moduleConfigs[0]);
const tournamentsRoutes = buildCrudRouter(moduleConfigs[1]);
const matchesRoutes = buildCrudRouter(moduleConfigs[2]);

module.exports = { playersRoutes, tournamentsRoutes, matchesRoutes };
