/**
 * FIFA World Cup 2026 scoring rules:
 * - Exact score: 3 points
 * - Correct result (win/draw): 1 point
 * - Wrong: 0 points
 */
function calculatePoints(homePred, awayPred, homeScore, awayScore) {
  if (homePred === homeScore && awayPred === awayScore) return 3;
  const predResult = Math.sign(homePred - awayPred);
  const actualResult = Math.sign(homeScore - awayScore);
  if (predResult === actualResult) return 1;
  return 0;
}

async function recalculateUserPhasePoints(client, userId, phase) {
  const ptsCol = phase === 1 ? 'p1pts' : 'p2pts';
  const result = await client.query(
    `SELECT COALESCE(SUM(p.points), 0) AS total
     FROM predictions p
     JOIN matches m ON m.id = p.match_id
     WHERE p.user_id = $1 AND m.phase = $2 AND m.status = 'played'`,
    [userId, phase]
  );
  await client.query(`UPDATE users SET ${ptsCol} = $1 WHERE id = $2`, [
    parseInt(result.rows[0].total),
    userId,
  ]);
}

async function applyMatchResult(client, matchId, homeScore, awayScore) {
  const match = await client.query('SELECT * FROM matches WHERE id = $1', [matchId]);
  if (match.rows.length === 0) throw new Error('Partido no encontrado');

  const m = match.rows[0];
  await client.query(
    'UPDATE matches SET home_score = $1, away_score = $2, status = $3 WHERE id = $4',
    [homeScore, awayScore, 'played', matchId]
  );

  const preds = await client.query('SELECT * FROM predictions WHERE match_id = $1', [matchId]);
  for (const pred of preds.rows) {
    const pts = calculatePoints(pred.home_pred, pred.away_pred, homeScore, awayScore);
    await client.query('UPDATE predictions SET points = $1 WHERE id = $2', [pts, pred.id]);
  }

  const users = await client.query(
    'SELECT id FROM users WHERE status = $1 AND is_admin = FALSE',
    ['approved']
  );
  for (const u of users.rows) {
    await recalculateUserPhasePoints(client, u.id, m.phase);
  }

  return m;
}

module.exports = { calculatePoints, recalculateUserPhasePoints, applyMatchResult };
