const pool = require("./db");
const { Router } = require("express");
const { hash, Session } = require("./helper");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query("SELECT * FROM users", (q_err, q_res) => {
		if (q_err) return next(q_err);

		res.json(q_res.rows);
	});
});

const set_session_cookie = (session_str, res) => {
	res.cookie("session_str", session_str, {
		expire: Date.now() + 3600000,
		httpOnly: true
		// secure: true
	});
};

const set_session = (email, res, session_id) => {
	let session, session_str;

	if (session_id) {
		session_str = Session.dataToString(email, session_id);
	} else {
		session = new Session(email);
		session_str = session.toString();
	}

	return new Promise((resolve, reject) => {
		if (session_id) {
			set_session_cookie(session_str, res);
			resolve();
		} else {
			pool.query(
				"UPDATE users SET session_id = $1 WHERE email_hash = $2",
				[session.id, hash(email)],
				(q_err, q_res) => {
					if (q_err) return reject(q_err);

					set_session_cookie(session_str, res);

					resolve();
				}
			);
		}
	});
};

router.post("/new", (req, res, next) => {
	const { email, password, userFirstName, userLastName, status } = req.body;
	const email_hash = hash(email);

	pool.query(
		"SELECT * FROM users WHERE email_hash = $1",
		[email_hash],
		(q0_err, q0_res) => {
			if (q0_err) return next(q0_err);

			if (q0_res.rows.length === 0) {
				//insert a new user
				pool.query(
					`INSERT INTO users(
						email_hash,
						password_hash,
						"userFirstName",
						"userLastName",
						status
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5
					)
					RETURNING *`,
					[email_hash, hash(password), userFirstName, userLastName, status],
					(q1_err, q1_res) => {
						if (q1_err) return next(q1_err);

						set_session(email, res)
							.then(() => {
								res.json({
									msg: "Successfully created user!",
									user: q1_res.rows[0]
								});
							})
							.catch(error => next(error));
					}
				);
			} else {
				res.status(409).json({
					type: "error",
					msg: "This email has been taken"
				});
			}
		}
	);
});

router.post("/login", (req, res, next) => {
	const { email, password } = req.body;
	pool.query(
		`SELECT * 
		FROM users
		WHERE email_hash = $1`,
		[hash(email)],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			const user = q_res.rows[0];

			if (user && user.password_hash === hash(password)) {
				set_session(email, res, user.session_id)
					.then(() => {
						res.json({
							completed: true,
							user
						});
					})
					.catch(error => next(error));
			} else {
				res
					.status(400)
					.json({ type: "error", msg: "Incorrect email/password" });
			}
		}
	);
});

router.get("/logout", (req, res, next) => {
	const { email } = Session.parse(req.cookies.session_str);

	pool.query(
		"UPDATE users SET session_id = NULL WHERE email_hash = $1",
		[hash(email)],
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.clearCookie("session_str");

			res.json({ msg: "Successful logout" });
		}
	);
});

router.get("/authenticated", (req, res, next) => {
	const { email, id } = Session.parse(req.cookies.session_str);
	pool.query(
		"SELECT * FROM users WHERE email_hash = $1",
		[hash(email)],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			if (q_res.rows.length === 0) {
				return next(new Error("Not a valid email"));
			}

			res.json({
				authenticated:
					Session.verify(req.cookies.session_str) &&
					q_res.rows[0].session_id === id,
				user: q_res.rows[0]
			});
		}
	);
});

router.post("/teacher_info", (req, res, next) => {
	const { id } = req.body;
	let result = {};

	pool.connect((err, client, release) => {
		if (err) return next(err);

		client.query(`BEGIN`);

		client.query(
			`SELECT *
			FROM templates
			WHERE "creatorID" = $1`,
			[id],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				} else {
					if (q1_res.rows.length === 0) result["templates"] = {};
					result["templates"] = q1_res.rows.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}
		);

		client.query(
			`SELECT *
			FROM courses
			WHERE "creatorID" = $1`,
			[id],
			(q2_err, q2_res) => {
				if (q2_err) {
					release();
					return next(q2_err);
				} else {
					if (q2_res.rows.length === 0) result["courses"] = {};
					result["courses"] = q2_res.rows.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}
		);

		client.query(
			`SELECT *
			FROM polls
			WHERE "creatorID" = $1`,
			[id],
			(q3_err, q3_res) => {
				if (q3_err) {
					release();
					return next(q3_err);
				} else {
					if (q3_res.rows.length === 0) result["polls"] = {};
					result["polls"] = q3_res.rows.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}
		);

		client.query(`COMMIT`, (q4_err, q4_res) => {
			if (q4_err) {
				return next(q4_err);
				release();
			} else {
				res.json({
					completed: true,
					...result
				});
				release();
			}
		});
	});
});

router.post(`/student_info`, (req, res, next) => {
	const { courseIDs, pollIDs } = req.body;
	let result = {};

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query(`BEGIN`);
		//Retrieve courses
		client.query(
			`SELECT id, "courseTitle", "courseCode", creator
			FROM courses
			WHERE id = ANY($1)`,
			[courseIDs],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				} else {
					if (q0_res.rows.length === 0) result.courses = {};
					result.courses = q0_res.rows.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}
		);
		//Retrieve Polls
		client.query(
			`SELECT
				id,
				"pollTitle",
				"creator",
				"templateID"
			FROM polls
			WHERE id = ANY($1)`,
			[pollIDs],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				} else {
					if (q1_res.rows.length === 0) result.polls = {};
					result.polls = q1_res.rows.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}
		);
		client.query(`COMMIT`, (q2_err, q2_res) => {
			release();
			if (q2_err) {
				return next(q2_err);
			} else {
				res.json({
					completed: true,
					...result
				});
			}
		});
	});
});

module.exports = router;
