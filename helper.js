const SHA256 = require("crypto-js/sha256");
const { APP_SECRET } = require("./secrets/index");
const uuid = require("uuid/v4");

const hash = str => {
	return SHA256(`${APP_SECRET}${str}${APP_SECRET}`).toString();
};

class Session {
	constructor(email) {
		this.email = email;
		this.id = uuid();
	}

	toString() {
		return Session.dataToString(this.email, this.id);
	}

	static userData(email, id) {
		return `${email}|${id}`;
	}

	static dataToString(email, id) {
		const user_data = Session.userData(email, id);
		return `${user_data}|${hash(user_data)}`;
	}

	static parse(session_str) {
		const session_data = session_str.split("|");
		return {
			email: session_data[0],
			id: session_data[1],
			session_hash: session_data[2]
		};
	}

	static verify(session_str) {
		const { email, id, session_hash } = Session.parse(session_str);
		const user_data = Session.userData(email, id);

		return hash(user_data) === session_hash;
	}
}

module.exports = { hash, Session };
