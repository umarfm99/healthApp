const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connect } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function createUser(email, password) {
  const client = connect();
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL
  );`);

  const hashed = await bcrypt.hash(password, 10);
  const res = await client.query('INSERT INTO users(email,password) VALUES($1,$2) RETURNING id,email', [email, hashed]);
  await client.end();
  return res.rows[0];
}

async function verifyUser(email, password) {
  const client = connect();
  await client.connect();
  const res = await client.query('SELECT id,email,password FROM users WHERE email=$1 LIMIT 1', [email]);
  await client.end();
  if (!res.rows.length) return null;
  const user = res.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return { id: user.id, email: user.email };
}

function sign(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

function verify(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { createUser, verifyUser, sign, verify };
