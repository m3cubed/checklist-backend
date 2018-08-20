const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM templates`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json(q_res.rows);
		}
	);
});

router.post("/new", (req, res, next) => {
	const { templateTitle, creator, creatorID, length } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query(
			`INSERT INTO templates("templateTitle", creator, "creatorID") 
			VALUES ($1, $2, $3) 
			RETURNING *`,
			[templateTitle, creator, creatorID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				} else {
					const templateIDs = {
						[q0_res.rows[0].id]: length
					};

					client.query(
						`UPDATE users 
						SET "templateIDs" = "templateIDs" || (VALUES ($2))::jsonb 
						WHERE id = $1`,
						[creatorID, templateIDs],
						(q1_err, q1_res) => {
							release();
							if (q1_err) {
								return next(q1_err);
							}

							res.json(q0_res.rows[0]);
						}
					);
				}
			}
		);
	});
});

router.put("/delete", (req, res, next) => {
	const { id, questionIDs, creatorID } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query("BEGIN");
		//remove templateID from user's templateIDs
		client.query(
			`UPDATE users 
			SET "templateIDs" = "templateIDs" - (VALUES($1)) 
			WHERE id = $2`,
			[id, creatorID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				}
			}
		);
		//remove all questions in the template's collection
		client.query(
			`DELETE 
			FROM questions 
			WHERE "templateID" = $1`,
			[id],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				}
			}
		);
		//delete the template
		client.query(
			`DELETE 
			FROM templates 
			WHERE id = $1`,
			[id],
			(q2_err, q2_res) => {
				if (q2_err) {
					release();
					return next(q2_err);
				}
			}
		);

		client.query(`COMMIT`, (q3_err, q3_res) => {
			release();
			if (q3_err) {
				return next(q3_err);
			} else {
				res.json({ completed: true });
			}
		});
	});
});

module.exports = router;
