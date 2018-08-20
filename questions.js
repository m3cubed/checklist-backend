const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM questions`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json(q_res.rows);
		}
	);
});

router.post(`/retrieve_questions`, (req, res, next) => {
	const { templateID } = req.body;
	pool.query(
		`SELECT "questionIDs"
		FROM templates
		WHERE id = $1`,
		[templateID],
		(q0_err, q0_res) => {
			if (q0_err) {
				return next(q0_err);
			} else {
				pool.query(
					`SELECT *
					FROM questions
					WHERE id = ANY($1)`,
					[Object.keys(q0_res.rows[0].questionIDs)],
					(q1_err, q1_res) => {
						if (q1_err) {
							return next(q1_err);
						} else {
							res.json({
								completed: true,
								questions: q1_res.rows.reduce((acc, item) => {
									acc[item.id] = item;
									return acc;
								}, {})
							});
						}
					}
				);
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { questionTitle, templateID, length } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		//add question to questions list
		client.query(
			`INSERT 
			INTO questions("questionTitle",  "templateID") 
			VALUES ($1, $2) 
			RETURNING *`,
			[questionTitle, templateID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				} else {
					const questionIDs = {
						[q0_res.rows[0].id]: length
					};
					//add questionID to template
					client.query(
						`UPDATE templates 
						SET "questionIDs" = "questionIDs" || (VALUES($1))::jsonb 
						WHERE id = $2`,
						[questionIDs, templateID],
						(q1_err, q1_res) => {
							release();
							if (q1_err) {
								return next(q1_err);
							} else {
								res.json(q0_res.rows[0]);
							}
						}
					);
				}
			}
		);
	});
});

router.put("/format", (req, res, next) => {
	const { id, format } = req.body;

	pool.query(
		`UPDATE questions 
		SET "format" = "format" || (VALUES($1))::jsonb 
		WHERE id = $2`,
		[format, id],
		(q0_err, q0_res) => {
			if (q0_err) {
				return next(q0_err);
			} else {
				res.json({
					completed: true
				});
			}
		}
	);
});

router.put("/delete", (req, res, next) => {
	const { questionID, templateID } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query("BEGIN");
		//delete the question with the targeted ID
		client.query(
			`DELETE 
			FROM questions 
			WHERE id = $1`,
			[questionID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				}
			}
		);
		//delete the questionID from template
		client.query(
			`UPDATE templates 
			SET "questionIDs" = "questionIDs" - (VALUES($1)) 
			WHERE id = $2`,
			[questionID, templateID],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				}
			}
		);
		client.query(`COMMIT`, (q2_err, q2_res) => {
			release();
			if (q2_err) {
				return next(q2_err);
			} else {
				res.json({ completed: true });
			}
		});
	});
});

module.exports = router;
