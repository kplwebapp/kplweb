const ApiError = require('../../utils/ApiError');
const { toPublicPath, removeUploadedFile } = require('../../utils/uploadFiles');
const repo = require('./tournamentDetails.repository');
const { buildPointsTable } = require('./pointsTable');
const { parseYoutubeId, youtubeWatchUrl } = require('./youtube');

const notFound = (what = 'Tournament') => new ApiError(404, `${what} not found`);

const removeFiles = (paths) => Promise.all(paths.map((p) => removeUploadedFile(p)));

/** Throws 404 unless the id belongs to a tournament (events don't have teams, matches or galleries). */
const ensureTournament = async (id) => {
  const record = await repo.findTournament(id);
  if (!record || record.kind !== 'TOURNAMENT') throw notFound();
  return record;
};

/** Completed matches need a result; scheduled/no-result matches never have one. */
const normaliseMatch = (data) => {
  const match = { ...data };
  if (match.status === 'COMPLETED') {
    if (!match.result) throw new ApiError(400, 'Choose the result for a completed match.');
  } else {
    match.result = null;
  }
  return match;
};

const ensureTeamsInTournament = async (eventId, match) => {
  const teamIds = new Set((await repo.findTeams(eventId)).map((t) => t.team_id));
  if (!teamIds.has(match.team1_id) || !teamIds.has(match.team2_id)) {
    throw new ApiError(400, 'Both teams must be added to this tournament first.');
  }
};

const splitMedia = (media) => ({
  photos: media.filter((m) => m.media_type === 'PHOTO'),
  videos: media.filter((m) => m.media_type === 'VIDEO'),
});

const tournamentDetailsService = {
  getPublicDetails: async (slug) => {
    const eventId = await repo.findPublicTournamentIdBySlug(slug);
    if (!eventId) throw notFound();
    const [teams, matches, media] = await Promise.all([
      repo.findTeams(eventId),
      repo.findMatches(eventId),
      repo.findMedia(eventId),
    ]);
    return { teams, points_table: buildPointsTable(teams, matches), ...splitMedia(media) };
  },

  // ---------- teams ----------
  listTeams: async (eventId) => {
    await ensureTournament(eventId);
    return repo.findTeams(eventId);
  },

  addTeams: async (eventId, teamIds) => {
    const tournament = await ensureTournament(eventId);
    const unique = [...new Set(teamIds)];
    const existing = await repo.findExistingTeamIds(unique);
    if (existing.length !== unique.length) throw new ApiError(400, 'One or more teams do not exist.');
    if (tournament.category_id && existing.some((t) => t.category_id !== tournament.category_id)) {
      throw new ApiError(400, "Only teams from this tournament's game can be added.");
    }
    await repo.addTeams(eventId, unique);
    return repo.findTeams(eventId);
  },

  removeTeam: async (eventId, teamId) => {
    await ensureTournament(eventId);
    if ((await repo.countTeamMatches(eventId, teamId)) > 0) {
      throw new ApiError(409, 'This team has matches in this tournament. Delete those matches first.');
    }
    if (!(await repo.removeTeam(eventId, teamId))) throw notFound('Team');
  },

  // ---------- matches & points ----------
  listMatches: async (eventId) => {
    await ensureTournament(eventId);
    return repo.findMatches(eventId);
  },

  createMatch: async (eventId, data) => {
    await ensureTournament(eventId);
    const match = normaliseMatch(data);
    await ensureTeamsInTournament(eventId, match);
    return repo.createMatch(eventId, match);
  },

  updateMatch: async (eventId, matchId, data) => {
    await ensureTournament(eventId);
    const match = normaliseMatch(data);
    await ensureTeamsInTournament(eventId, match);
    const updated = await repo.updateMatch(eventId, matchId, match);
    if (!updated) throw notFound('Match');
    return updated;
  },

  removeMatch: async (eventId, matchId) => {
    await ensureTournament(eventId);
    if (!(await repo.removeMatch(eventId, matchId))) throw notFound('Match');
  },

  getPointsTable: async (eventId) => {
    await ensureTournament(eventId);
    const [teams, matches] = await Promise.all([repo.findTeams(eventId), repo.findMatches(eventId)]);
    return buildPointsTable(teams, matches);
  },

  // ---------- media ----------
  listMedia: async (eventId) => {
    await ensureTournament(eventId);
    return splitMedia(await repo.findMedia(eventId));
  },

  addPhotos: async (eventId, files = [], caption) => {
    const urls = files.map((f) => toPublicPath(f.filename));
    try {
      if (urls.length === 0) throw new ApiError(400, 'Choose at least one photo to upload.');
      await ensureTournament(eventId);
      return await repo.addPhotos(eventId, urls, String(caption ?? '').trim().slice(0, 300));
    } catch (err) {
      await removeFiles(urls);
      throw err;
    }
  },

  /** Adds all links or none: every link is checked before anything is saved. */
  addVideos: async (eventId, videos) => {
    await ensureTournament(eventId);
    const parsed = videos.map((v) => ({ ...v, youtubeId: parseYoutubeId(v.url) }));
    const invalid = parsed.map((v, i) => (v.youtubeId ? null : i + 1)).filter(Boolean);
    if (invalid.length > 0) {
      if (videos.length === 1) throw new ApiError(400, 'This is not a valid YouTube video link.');
      throw new ApiError(
        400,
        invalid.length === 1
          ? `Link ${invalid[0]} is not a valid YouTube video link.`
          : `Links ${invalid.join(', ')} are not valid YouTube video links.`
      );
    }
    return repo.addVideos(
      eventId,
      parsed.map((v) => ({ url: youtubeWatchUrl(v.youtubeId), youtubeId: v.youtubeId, caption: v.caption }))
    );
  },

  updateCaption: async (eventId, mediaId, caption) => {
    await ensureTournament(eventId);
    const item = await repo.updateCaption(eventId, mediaId, caption);
    if (!item) throw notFound('Gallery item');
    return item;
  },

  removeMedia: async (eventId, mediaId) => {
    await ensureTournament(eventId);
    const item = await repo.findMediaItem(eventId, mediaId);
    if (!item || !(await repo.removeMedia(eventId, mediaId))) throw notFound('Gallery item');
    if (item.media_type === 'PHOTO') await removeUploadedFile(item.url);
  },
};

module.exports = tournamentDetailsService;
