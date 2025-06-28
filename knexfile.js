const config = {
  client: 'pg',
  connection: {
  connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
};

module.exports = config;
