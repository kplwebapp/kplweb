const ApiError = require('../../utils/ApiError');
const { toPublicPath, removeUploadedFile } = require('../../utils/uploadFiles');
const teamsRepository = require('./teams.repository');

const notFound = () => new ApiError(404, 'Team not found');

const withDuplicateCheck = async (action) => {
  try {
    return await action();
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'Another team in this game already uses this name or code.');
    throw err;
  }
};

const ensureGame = async (categoryId) => {
  if (!(await teamsRepository.isTournamentCategory(categoryId))) {
    throw new ApiError(400, 'Choose a valid game for this team.');
  }
};

const teamsService = {
  list: (categoryId) => teamsRepository.findAll(categoryId),

  getById: async (id) => {
    const team = await teamsRepository.findById(id);
    if (!team) throw notFound();
    return team;
  },

  create: async (data) => {
    await ensureGame(data.category_id);
    return withDuplicateCheck(() => teamsRepository.create(data));
  },

  update: async (id, data) => {
    if (data.category_id !== undefined) {
      const current = await teamsRepository.findById(id);
      if (!current) throw notFound();
      if (current.category_id !== data.category_id) {
        await ensureGame(data.category_id);
        if (await teamsRepository.isInAnyTournament(id)) {
          throw new ApiError(409, "This team already plays in a tournament, so its game can't be changed.");
        }
      }
    }
    const team = await withDuplicateCheck(() => teamsRepository.update(id, data));
    if (!team) throw notFound();
    return team;
  },

  setLogo: async (id, file) => {
    if (!file) throw new ApiError(400, 'Choose an image file to upload.');
    const newPath = toPublicPath(file.filename);
    const previous = await teamsRepository.findById(id);
    if (!previous) {
      await removeUploadedFile(newPath);
      throw notFound();
    }
    const team = await teamsRepository.setLogo(id, newPath);
    await removeUploadedFile(previous.team_logo);
    return team;
  },

  removeLogo: async (id) => {
    const previous = await teamsRepository.findById(id);
    if (!previous) throw notFound();
    const team = await teamsRepository.setLogo(id, null);
    await removeUploadedFile(previous.team_logo);
    return team;
  },
};

module.exports = teamsService;
