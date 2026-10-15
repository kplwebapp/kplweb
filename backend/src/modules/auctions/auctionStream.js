const logger = require('../../utils/logger');

/**
 * Server-Sent Events for live auctions. State lives in Postgres; this only fans out the public
 * snapshot after each committed change, so a restart loses nothing: clients reconnect and
 * receive the current snapshot first.
 */

const HEARTBEAT_MS = 20000;
const MAX_CLIENTS = 1000;

const clients = new Map(); // auctionId -> Set<res>
let clientCount = 0;
let snapshotBuilder = null;

const setSnapshotBuilder = (fn) => {
  snapshotBuilder = fn;
};

const send = (res, snapshot) => {
  res.write(`event: snapshot\nid: ${snapshot.auction.version}\ndata: ${JSON.stringify(snapshot)}\n\n`);
};

const subscribe = async (res, auctionId) => {
  if (clientCount >= MAX_CLIENTS) {
    res.status(503).json({ success: false, message: 'Too many live viewers right now; the page will refresh instead.' });
    return;
  }

  const snapshot = await snapshotBuilder(auctionId);
  if (!snapshot) {
    res.status(404).json({ success: false, message: 'Auction not found' });
    return;
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  send(res, snapshot);

  const set = clients.get(auctionId) ?? new Set();
  set.add(res);
  clients.set(auctionId, set);
  clientCount += 1;

  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  res.on('close', () => {
    clearInterval(heartbeat);
    set.delete(res);
    if (set.size === 0) clients.delete(auctionId);
    clientCount -= 1;
  });
};

/** Pushes the latest public snapshot to everyone watching the auction. Never throws. */
const publish = async (auctionId) => {
  const set = clients.get(auctionId);
  if (!set || set.size === 0) return;
  try {
    const snapshot = await snapshotBuilder(auctionId);
    if (!snapshot) {
      // No longer public (cancelled): tell viewers and let them go.
      for (const res of set) res.end('event: gone\ndata: {}\n\n');
      return;
    }
    for (const res of set) send(res, snapshot);
  } catch (err) {
    logger.error('Auction live update failed', { auctionId, error: err.message });
  }
};

module.exports = { subscribe, publish, setSnapshotBuilder };
