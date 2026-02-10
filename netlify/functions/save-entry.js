const { connect } = require('./_shared/db');
const { verify } = require('./_shared/auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, body: 'Missing DATABASE_URL' };
  }

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const verified = verify(token);
  if (!verified) return { statusCode: 401, body: 'Unauthorized' };

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const client = connect();
  try {
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS entries (
      id serial PRIMARY KEY,
      user_id integer REFERENCES users(id) ON DELETE CASCADE,
      date text,
      sleep real,
      water real,
      stress integer,
      symptom text
    );`);

    const { date, sleep, water, stress, symptom } = payload;
    await client.query(
      'INSERT INTO entries(user_id,date,sleep,water,stress,symptom) VALUES($1,$2,$3,$4,$5,$6)',
      [verified.sub, date, sleep, water, stress, symptom]
    );

    const res = await client.query('SELECT date,sleep,water,stress,symptom FROM entries WHERE user_id=$1 ORDER BY date ASC LIMIT 30', [verified.sub]);
    await client.end();
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    try { await client.end(); } catch (e) {}
    return { statusCode: 500, body: String(err) };
  }
};
