const { Pool } = require("pg");
const db_config = require("./secrets/db_configuration");

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});
module.exports = pool;
