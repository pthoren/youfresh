import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  } : {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'youfresh_dev'
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
});

export default db;
