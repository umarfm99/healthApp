const { verifyUser, sign } = require('./_shared/auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body;
  try { body = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { email, password } = body;
  if (!email || !password) return { statusCode: 400, body: 'Missing email or password' };

  try {
    const user = await verifyUser(email, password);
    if (!user) return { statusCode: 401, body: 'Invalid credentials' };
    const token = sign(user);
    return { statusCode: 200, body: JSON.stringify({ token }) };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
