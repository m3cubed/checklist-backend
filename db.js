const { Pool } = require("pg");
const db_config = require("./secrets/db_configuration");

poolParam =
	process.env.NODE_ENV === "production"
		? {
				connectionString: process.env.DATABASE_URL
		  }
		: db_config;

const pool = new Pool(poolParam);
module.exports = pool;
