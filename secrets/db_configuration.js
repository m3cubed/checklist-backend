let user, host, databse, password;

if (process.env.MODE === "production") {
	user = "fdwcftonyupphr";
	host = "ec2-54-163-246-5.compute-1.amazonaws.com";
	database = "d2rp4m1o42lpn";
	password = process.env.DB_PASSWORD;
} else {
	user = "node_user";
	host = "localhost";
	database = "usersdb";
	password = "Alphamon11!@#";
}

module.exports = { user, host, database, password, port: 5432 };
