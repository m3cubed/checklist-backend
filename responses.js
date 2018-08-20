const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM responses`,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json(q_res.rows);
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { questionID, pollResponseID } = req.body;

	pool.query(
		`INSERT INTO responses(
					"questionID",
					"pollResponseID"
				) VALUES (
					$1,
					$2
				)
				RETURNING *`,
		[questionID, pollResponseID],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			res.json({
				completed: true,
				response: q_res.rows[0]
			});
		}
	);
});

router.put("/retrieve", (req, res, next) => {
	const { pollResponseID } = req.body;
	pool.query(
		`SELECT *
		FROM responses
		WHERE "pollResponseID" = $1`,
		[pollResponseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else if (q_res.rows.length === 0) {
				res.json({
					completed: false
				});
			} else {
				res.json({
					completed: true,
					responses: q_res.rows
				});
			}
		}
	);
});

router.put("/submit_answers", (req, res, next) => {
	const { responses, pollResponseID } = req.body;

	let queries = Object.keys(responses).map(key => {
		new Promise((resolve, reject) => {
			pool.query(
				`UPDATE responses
				SET answer = $1
				WHERE id = $2`,
				[responses[key].answer, responses[key].id],
				(q_err, q_res) => {
					if (q_err) {
						return next(q_err);
						reject();
					} else {
						resolve();
					}
				}
			);
		});
	});

	Promise.all(queries)
		.then(() => {
			pool.query(
				`UPDATE user_poll_responses
			SET completed = true
			WHERE id = $1`,
				[pollResponseID],
				(q_err, q_res) => {
					if (q_err) {
						return next(q_err);
					} else {
						res.json({
							completed: true
						});
					}
				}
			);
		})
		.catch(err => res.json({ completed: false, err }));
});

module.exports = router;
