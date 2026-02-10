const { connect } = require('./_shared/db');
const { verify } = require('./_shared/auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, body: 'Missing DATABASE_URL' };
  }

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const verified = verify(token);
  if (!verified) return { statusCode: 401, body: 'Unauthorized' };

  const client = connect();
  try {
    await client.connect();
    const res = await client.query('SELECT date,sleep,water,stress,symptom FROM entries WHERE user_id=$1 ORDER BY date ASC LIMIT 30', [verified.sub]);
    await client.end();
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    try { await client.end(); } catch (e) {}
    return { statusCode: 500, body: String(err) };
  }
};
