const { Router } = require('express');
const validate = require('../middleware/validate');
const { authRateLimit } = require('../middleware/security');
const { registerSchema, loginSchema } = require('../modules/auth/auth.validation');
const authController = require('../modules/auth/auth.controller');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const rolesRoutes = require('../modules/roles/roles.routes');
const { playersRoutes, tournamentsRoutes } = require('../modules/_crud/crud.routes');
const teamsRoutes = require('../modules/teams/teams.routes');
const matchesRoutes = require('../modules/matches/matches.routes');
const scoringRoutes = require('../modules/scoring/scoring.routes');
const statisticsRoutes = require('../modules/statistics/statistics.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const sponsorsRoutes = require('../modules/sponsors/sponsors.routes');
const eventsRoutes = require('../modules/events/events.routes');
const tournamentDetailsRoutes = require('../modules/tournamentDetails/tournamentDetails.routes');
const tournamentRegistrationRoutes = require('../modules/tournamentRegistration/tournamentRegistration.routes');
const categoriesRoutes = require('../modules/categories/categories.routes');
const galleryRoutes = require('../modules/gallery/gallery.routes');
const pagesRoutes = require('../modules/pages/pages.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const contactRoutes = require('../modules/contact/contact.routes');
const profileRoutes = require('../modules/profile/profile.routes');
const auctionsRoutes = require('../modules/auctions/auctions.routes');

const router = Router();

router.use('/auth', authRoutes);

// Legacy paths still used by frontend (without /auth prefix)
router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);

router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/teams', teamsRoutes);
router.use('/players', playersRoutes);
router.use('/tournaments', tournamentsRoutes);
router.use('/matches', matchesRoutes);
router.use('/scoring', scoringRoutes);
router.use('/stats', statisticsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/sponsors', sponsorsRoutes);
router.use('/events', tournamentDetailsRoutes);
router.use('/events', tournamentRegistrationRoutes);
router.use('/events', eventsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/gallery', galleryRoutes);
router.use('/pages', pagesRoutes);
router.use('/settings', settingsRoutes);
router.use('/contact', contactRoutes);
router.use('/profile', profileRoutes);
router.use('/auctions', auctionsRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'KPL API is healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
