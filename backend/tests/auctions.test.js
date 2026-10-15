/**
 * End-to-end auction flow through the HTTP API.
 *
 * Runs only against a disposable database whose name ends in "_test" (default kpl_migration_test,
 * migrated with scripts/migrate.js). Auction bids and events cannot be deleted, so test data stays.
 *
 *   cd backend && node --test "tests/*.test.js"
 */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'kpl_migration_test';
if (!process.env.DB_NAME.endsWith('_test')) {
  throw new Error(`Refusing to run auction tests against "${process.env.DB_NAME}"; use a *_test database.`);
}
process.env.LOG_LEVEL = 'error';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const pool = require('../src/config/database');

const run = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
let server;
let base;
const tokens = {};
const ids = { teams: [], members: [] };

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* CSV or empty */
  }
  return { status: res.status, body: json, text, headers: res.headers };
};

const q = (sql, params) => pool.query(sql, params);

async function createUser(label, vibhaag = 'Navsari') {
  const { rows } = await q(
    `INSERT INTO users (first_name, last_name, full_name, email, password_hash, vibhaag, is_active)
     VALUES ($1, $2, $3, $4, 'x', $5, TRUE) RETURNING user_id`,
    ['Test', label, `Test ${label}`, `${label.toLowerCase().replace(/\s/g, '')}.${run}@kpl.test`, vibhaag]
  );
  return rows[0].user_id;
}

async function ensureRole(code, permissions) {
  const { rows } = await q(
    `INSERT INTO roles (role_code, role_name) VALUES ($1, $1)
     ON CONFLICT (role_code) DO UPDATE SET role_name = EXCLUDED.role_name RETURNING role_id`,
    [code]
  );
  await q(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, permission_id FROM permissions WHERE permission_code = ANY($2)
     ON CONFLICT DO NOTHING`,
    [rows[0].role_id, permissions]
  );
  return rows[0].role_id;
}

async function userWithRole(label, roleId) {
  const userId = await createUser(label);
  await q('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
  return jwt.sign({ sub: userId }, env.jwt.secret, { expiresIn: '1h' });
}

/** Opens the live stream and resolves with each snapshot as it arrives. */
function openStream(auctionId) {
  const snapshots = [];
  const waiters = [];
  let headers;
  const req = http.get(`${base}/api/auctions/${auctionId}/stream`, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
    headers = res.headers;
    let buffer = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = block.split('\n').find((l) => l.startsWith('data: '));
        if (block.includes('event: snapshot') && data) {
          snapshots.push(JSON.parse(data.slice(6)));
          waiters.splice(0).forEach((w) => w());
        }
      }
    });
  });
  const waitFor = (predicate, ms = 5000) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No matching live update')), ms);
      const check = () => {
        const hit = snapshots.find(predicate);
        if (hit) {
          clearTimeout(timer);
          resolve(hit);
        } else waiters.push(check);
      };
      check();
    });
  return { waitFor, close: () => req.destroy(), headers: () => headers };
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  const admin = await ensureRole('ADMIN', ['auctions:read', 'auctions:manage', 'auctions:operate']);
  const operator = await ensureRole('AUCTION_OPERATOR_TEST', ['auctions:read', 'auctions:operate']);
  const player = await ensureRole('PLAYER', []);
  tokens.admin = await userWithRole('Admin', admin);
  tokens.operator = await userWithRole('Operator', operator);
  tokens.player = await userWithRole('Player', player);

  const { rows: cat } = await q(`SELECT category_id FROM activity_categories WHERE kind = 'TOURNAMENT' AND slug = 'cricket'`);
  const cricket = cat[0].category_id;
  const { rows: t } = await q(`INSERT INTO tournaments (tournament_name) VALUES ($1) RETURNING tournament_id`, [`KPL ${run}`]);
  const { rows: s } = await q(
    `INSERT INTO seasons (tournament_id, season_name, season_year) VALUES ($1, $2, 2026) RETURNING season_id`,
    [t[0].tournament_id, `Season ${run}`]
  );
  ids.season = s[0].season_id;
  const { rows: e } = await q(
    `INSERT INTO events (title, slug, kind, category_id, event_date) VALUES ($1, $2, 'TOURNAMENT', $3, '2026-12-01') RETURNING event_id`,
    [`Cricket Cup ${run}`, `cricket-cup-${run}`, cricket]
  );
  ids.event = e[0].event_id;

  for (const name of ['Alpha', 'Bravo', 'Charlie']) {
    const { rows } = await q(
      `INSERT INTO teams (team_name, short_name, category_id) VALUES ($1, $2, $3) RETURNING team_id`,
      [`${name} ${run}`, name.slice(0, 3).toUpperCase(), cricket]
    );
    ids.teams.push(rows[0].team_id);
    await q('INSERT INTO tournament_teams (event_id, team_id) VALUES ($1, $2)', [ids.event, rows[0].team_id]);
  }
  for (let i = 1; i <= 6; i += 1) {
    const userId = await createUser(`Member ${i}`, 'Valsad');
    ids.members.push(userId);
    await q(`INSERT INTO tournament_registrations (event_id, user_id, status) VALUES ($1, $2, 'REGISTERED')`, [ids.event, userId]);
  }
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('auction access', () => {
  it('lets anyone read public auction data', async () => {
    assert.equal((await api('GET', '/auctions/public')).status, 200);
  });

  it('requires a login and the right permission for administration', async () => {
    assert.equal((await api('GET', '/auctions/manage')).status, 401);
    assert.equal((await api('GET', '/auctions/manage', { token: tokens.player })).status, 403);
    assert.equal((await api('GET', '/auctions/manage', { token: tokens.operator })).status, 200);
    const create = await api('POST', '/auctions/manage', {
      token: tokens.operator,
      body: { title: 'x', season_id: ids.season, budget_per_team: 1, max_players_per_team: 1, min_bid_increment: 1 },
    });
    assert.equal(create.status, 403);
  });

  it('has retired the old lot-editing endpoints', async () => {
    assert.equal((await api('PUT', '/auctions', { token: tokens.admin, body: {} })).status, 410);
  });
});

describe('auction flow', () => {
  let auctionId;
  let lots;
  let cat;
  const [A, B, C] = [0, 1, 2];
  const team = (i) => ids.teams[i];
  const op = (path, body) => api('POST', `/auctions/manage/${auctionId}${path}`, { token: tokens.operator, body });
  const adm = (method, path, body) => api(method, `/auctions/manage/${auctionId}${path}`, { token: tokens.admin, body });
  const bid = (lot, teamIndex, amount) => op('/live/bid', { lot_id: lot, team_id: team(teamIndex), amount });
  const detail = async () => (await adm('GET', '')).body.data;
  const teamRow = async (i) => (await detail()).teams.find((t) => t.team_id === team(i));

  it('creates an auction linked to the tournament, with its teams', async () => {
    const res = await api('POST', '/auctions/manage', {
      token: tokens.admin,
      body: {
        title: `Auction ${run}`,
        season_id: ids.season,
        event_id: ids.event,
        budget_per_team: 1000,
        max_players_per_team: 3,
        min_bid_increment: 100,
        default_base_price: 100,
        categories: [
          { name: 'Batsman', base_price: 200, min_per_team: 0, max_per_team: 1 },
          { name: 'Bowler', base_price: 100, min_per_team: 0 },
        ],
      },
    });
    assert.equal(res.status, 201, res.text);
    auctionId = res.body.data.auction_id;
    const d = await detail();
    assert.equal(d.auction.status, 'DRAFT');
    assert.equal(d.teams.length, 3);
    assert.equal((await api('GET', `/auctions/${auctionId}/public`)).status, 404, 'drafts are not public');
    cat = Object.fromEntries(d.categories.map((c) => [c.name, c.auction_category_id]));

    const again = await api('POST', '/auctions/manage', {
      token: tokens.admin,
      body: { title: 'Dup', season_id: ids.season, event_id: ids.event, budget_per_team: 1, max_players_per_team: 1, min_bid_increment: 1 },
    });
    assert.equal(again.status, 409, 'one auction per tournament');
  });

  it('builds the player pool from tournament registrations', async () => {
    assert.equal((await adm('POST', '/status/ready')).status, 409, 'cannot be ready with an empty pool');
    const candidates = (await adm('GET', '/candidates')).body.data;
    assert.equal(candidates.length, 6);

    const add = (users, category) => adm('POST', '/players', { user_ids: users, auction_category_id: category });
    assert.equal((await add(ids.members.slice(0, 3), cat.Batsman)).status, 200);
    assert.equal((await add(ids.members.slice(3), cat.Bowler)).status, 200);
    assert.equal((await add(ids.members.slice(0, 1), cat.Bowler)).status, 400, 'already in the pool');
    assert.equal((await adm('GET', '/candidates')).body.data.length, 0);

    lots = (await detail()).lots.map((l) => l.lot_id);
    assert.equal(lots.length, 6);
  });

  it('follows the lifecycle: draft, ready, live', async () => {
    const asOperator = await api('GET', `/auctions/manage/${auctionId}`, { token: tokens.operator });
    assert.deepEqual(asOperator.body.data.can, { manage: false, operate: true });
    assert.deepEqual((await detail()).can, { manage: true, operate: true });
    assert.equal((await op('/status/start')).status, 409, 'must be ready first');
    assert.equal((await op('/status/ready')).status, 403, 'operators cannot finish setup');
    assert.equal((await adm('POST', '/status/ready')).status, 200);
    assert.equal((await op('/status/start')).status, 200);
    assert.equal((await adm('PUT', '/categories', { categories: [] })).status, 409, 'categories are fixed once live');
  });

  it('enforces bidding rules and serialises simultaneous bids', async () => {
    assert.equal((await op('/live/next', {})).status, 200);
    assert.equal((await bid(lots[0], A, 100)).status, 400, 'below the base price');
    assert.equal((await bid(lots[0], A, 200)).status, 200);
    assert.equal((await bid(lots[0], A, 300)).status, 400, 'already the highest bidder');
    assert.equal((await bid(lots[0], B, 250)).status, 400, 'below the minimum increment');

    const [b, c] = await Promise.all([bid(lots[0], B, 300), bid(lots[0], C, 300)]);
    assert.deepEqual([b.status, c.status].sort(), [200, 400], 'exactly one of two equal bids wins');
    const winner = b.status === 200 ? B : C;

    assert.equal((await op('/live/sold', { lot_id: lots[0] })).status, 200);
    const row = await teamRow(winner);
    assert.equal(row.spent, 300);
    assert.equal(row.remaining, 700);
    assert.equal(row.players_bought, 1);
    ids.winner = winner;
  });

  it('applies category limits, rejects stale screens and audits restarts', async () => {
    const W = ids.winner;
    const other = W === B ? C : B;
    assert.equal((await op('/live/next', {})).status, 200);
    assert.equal((await bid(lots[1], W, 200)).status, 400, 'Batsman limit is one per team');
    assert.equal((await bid(lots[1], other, 200)).status, 200);
    assert.equal((await op('/live/sold', { lot_id: lots[0] })).status, 409, 'stale player id');
    assert.equal((await op('/live/unsold', { lot_id: lots[1] })).status, 409, 'has bids');

    const restart = { lot_id: lots[1], reason: 'Wrong team pressed' };
    assert.equal((await op('/live/restart-bidding', restart)).status, 403, 'corrections need manage');
    assert.equal((await adm('POST', '/live/restart-bidding', restart)).status, 200);
    assert.equal((await op('/live/unsold', { lot_id: lots[1] })).status, 200);
    const { rows } = await q('SELECT COUNT(*)::int AS n FROM auction_bids WHERE lot_id = $1', [lots[1]]);
    assert.equal(rows[0].n, 1, 'restarted bids stay in history');
  });

  it('pushes live updates to stream viewers without compressing them', async () => {
    const stream = openStream(auctionId);
    try {
      const first = await stream.waitFor(() => true);
      assert.equal(stream.headers()['content-encoding'], undefined);
      assert.equal((await op('/live/next', {})).status, 200);
      const update = await stream.waitFor((s) => s.auction.version > first.auction.version && s.current);
      assert.equal(update.current.lot_id, lots[2]);
    } finally {
      stream.close();
    }
  });

  it('enforces budgets and squad sizes', async () => {
    const W = ids.winner;
    const third = [A, B, C].find((i) => i !== W && i !== (W === B ? C : B));
    assert.equal((await bid(lots[2], third, 1100)).status, 400, 'over budget');
    assert.equal((await bid(lots[2], third, 200)).status, 200);
    assert.equal((await op('/live/sold', { lot_id: lots[2] })).status, 200);

    const teams = (await detail()).teams.map((t) => ({
      team_id: t.team_id,
      budget: t.budget,
      max_players: t.team_id === team(W) ? 1 : t.max_players,
    }));
    assert.equal((await adm('PUT', '/teams', { teams })).status, 200);
    assert.equal((await op('/live/next', {})).status, 200);
    assert.equal((await bid(lots[3], W, 100)).status, 400, 'squad is full');
    assert.equal((await bid(lots[3], third, 100)).status, 200);
    assert.equal((await op('/live/sold', { lot_id: lots[3] })).status, 200);
  });

  it('brings an unsold player back in a new round', async () => {
    assert.equal((await op('/live/next', { lot_id: lots[1] })).status, 200);
    const d = await detail();
    assert.equal(d.current.lot_id, lots[1]);
    assert.equal(d.current.bid_round, 3);
    assert.equal(d.current.next_min_bid, 200);
    assert.equal((await op('/live/unsold', { lot_id: lots[1] })).status, 200);
  });

  it('reopens a sale with a reason and refunds the team', async () => {
    const W = ids.winner;
    assert.equal((await adm('POST', '/reopen', { lot_id: lots[0] })).status, 400, 'reason required');
    assert.equal((await adm('POST', '/reopen', { lot_id: lots[0], reason: 'Bid entered for the wrong team' })).status, 200);
    const row = await teamRow(W);
    assert.equal(row.spent, 0);
    const events = (await adm('GET', '/events')).body.data;
    assert.ok(events.some((e) => e.event_type === 'PLAYER_REOPENED' && e.lot_id === lots[0]));
  });

  it('pauses bidding', async () => {
    assert.equal((await op('/status/pause')).status, 200);
    assert.equal((await op('/live/next', {})).status, 409);
    assert.equal((await op('/status/resume')).status, 200);
  });

  it('never lets bid or event history change', async () => {
    await assert.rejects(q('DELETE FROM auction_bids WHERE auction_id = $1', [auctionId]));
    await assert.rejects(q('UPDATE auction_events SET amount = 0 WHERE auction_id = $1', [auctionId]));
  });

  it('completes the auction, marking players never sold as unsold', async () => {
    assert.equal((await op('/status/complete')).status, 200);
    const d = await detail();
    assert.equal(d.auction.status, 'COMPLETED');
    assert.equal(d.lots.filter((l) => l.status === 'PENDING').length, 0);
    assert.equal((await op('/live/next', {})).status, 409);

    const events = (await adm('GET', '/events')).body.data.map((e) => Number(e.seq)).sort((x, y) => x - y);
    assert.deepEqual(events, Array.from({ length: d.auction.version }, (_, i) => i + 1), 'one event per version');
  });

  it('serves a public view without private details', async () => {
    const res = await api('GET', `/auctions/${auctionId}/public`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.auction.status, 'COMPLETED');
    assert.equal(res.body.data.counts.sold, 2);
    assert.ok(!res.text.includes('@kpl.test'), 'no emails');
    assert.ok(!res.text.includes('user_id') && !res.text.includes('placed_by') && !res.text.includes('eligibility_note'));
  });

  it('exports results as CSV', async () => {
    const res = await adm('GET', '/export/results');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/csv/);
    assert.match(res.text, /Test Member 2/);
    assert.equal((await api('GET', `/auctions/manage/${auctionId}/export/results`)).status, 401);
  });
});
