let user, host, databse, password;

if (process.env.NODE_ENV === "production") {
	user = "jclpbspioolsgg";
	host = "ec2-54-235-94-36.compute-1.amazonaws.com";
	database = "dcpbkj58pc5mfi";
	password = process.env.DB_PASSWORD;
} else {
	user = "node_user";
	host = "localhost";
	database = "usersdb";
	password = "Alphamon11!@#";
}

module.exports = { user, host, database, password, port: 5432 };
