const ApiError = require('../../utils/ApiError');
const eventsRepository = require('../events/events.repository');
const { getProfile } = require('../profile/profile.service');
const repo = require('./tournamentRegistration.repository');

const CRICKET_CATEGORY = 'cricket';

const findCricketTournament = async (slug) => {
  const item = await eventsRepository.findPublicBySlug(slug);
  if (!item || item.kind !== 'TOURNAMENT') throw new ApiError(404, 'Tournament not found');
  if (item.category_slug !== CRICKET_CATEGORY) {
    throw new ApiError(400, 'Online registration is only available for cricket tournaments.');
  }
  return item;
};

const personalDetails = (profile) => ({
  first_name: profile.first_name,
  middle_name: profile.middle_name,
  last_name: profile.last_name,
  vibhaag: profile.vibhaag,
  date_of_birth: profile.date_of_birth,
  mobile: profile.mobile,
  email: profile.email,
});

const summary = (item) => ({
  event_id: item.event_id,
  title: item.title,
  slug: item.slug,
  status: item.status,
  event_date: item.event_date,
  end_date: item.end_date,
  venue: item.venue,
  category_name: item.category_name,
  image_url: item.image_url,
});

const tournamentRegistrationService = {
  getForm: async (slug, userId) => {
    const item = await findCricketTournament(slug);
    const [profile, skills, registration] = await Promise.all([
      getProfile(userId),
      repo.findCricketSkills(userId),
      repo.findRegistration(item.event_id, userId),
    ]);
    return {
      tournament: summary(item),
      is_open: item.status === 'UPCOMING',
      personal: personalDetails(profile),
      skills,
      registration,
    };
  },

  register: async (slug, userId, skills) => {
    const item = await findCricketTournament(slug);
    if (item.status !== 'UPCOMING') {
      throw new ApiError(400, 'Registration is closed because this tournament has already started.');
    }
    const { created, ...registration } = await repo.register(item.event_id, userId, skills);
    return { created, registration, skills };
  },
};

module.exports = tournamentRegistrationService;
