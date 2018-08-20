const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get(`/all`, (req, res, next) => {
	pool.query(
		`SELECT *
        FROM user_poll_responses`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json(q_res.rows);
		}
	);
});

router.post(`/new`, (req, res, next) => {
	const { pollID, creatorID } = req.body;
	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query(
			`INSERT INTO user_poll_responses(
					            completed,
					            "pollID",
					            "creatorID"
					        )
					        VALUES(
					            $1,
					            $2,
					            $3
                            )
                            RETURNING *`,
			[false, pollID, creatorID],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				} else {
					client.query(
						`UPDATE users
					                SET "todoPolls" = "todoPolls" - (VALUES($1)) || (VALUES($2))::jsonb
					                WHERE id = $3`,
						[pollID, { [pollID]: q1_res.rows[0].id }, creatorID],
						(q2_err, q2_res) => {
							release();
							if (q2_err) {
								return next(q2_err);
							} else {
								res.json({
									completed: true,
									response: q1_res.rows[0]
								});
							}
						}
					);
				}
			}
		);
	});
});

router.put("/retrieve", (req, res, next) => {
	const { userResponseID } = req.body;

	pool.query(
		`SELECT *
		FROM user_poll_responses
		WHERE id = $1`,
		[userResponseID],
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json({
				completed: true,
				userResponse: q_res.rows[0]
			});
		}
	);
});

module.exports = router;
