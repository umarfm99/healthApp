const { Client } = require('pg');

function connect() {
  const config = { connectionString: process.env.DATABASE_URL };
  if (!process.env.LOCAL_DEV) config.ssl = { rejectUnauthorized: false };
  return new Client(config);
}

module.exports = { connect };
