const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM polls`,
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
	const {
		creatorID,
		creator,
		dateSent,
		templateID,
		students,
		pollTitle
	} = req.body;

	const studentsArray = Object.keys(students).reduce((acc, key) => {
		if (students[key] === true) {
			acc[key] = "Sent";
		}
		return acc;
	}, {});

	pool.connect((err, client, release) => {
		if (err) {
			return next(err);
		}
		//Add polls to polls list
		client.query(
			`INSERT INTO polls (
				creator,
				"creatorID",
				"templateID",
				students,
				"pollTitle"
			)
			VALUES (
				$1,
				$2,
				$3,
				$4,
				$5
			)
			RETURNING *`,
			[creator, creatorID, templateID, studentsArray, pollTitle],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				} else {
					client.query(`BEGIN`);
					//update students with polls ID as incomplete
					client.query(
						`UPDATE users
						SET "todoPolls" = "todoPolls" || (VALUES($1))::jsonb
						WHERE id = ANY($2)`,
						[{ [q0_res.rows[0].id]: null }, Object.keys(studentsArray)],
						(q1_err, q1_res) => {
							if (q1_err) {
								release();
								return next(q1_err);
							}
						}
					);
					//update courses to add poll to pollsIDs
					client.query(
						`UPDATE courses
						SET "pollIDs" = "pollIDs" || (VALUES($1))::jsonb
						WHERE id = $2`,
						[{ [q0_res.rows[0].id]: q0_res.rows[0].timestamp }, templateID],
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
							res.json({
								completed: true,
								poll: q0_res.rows[0]
							});
						}
					});
				}
			}
		);
	});
});

router.put("/retrieve_questions", (req, res, next) => {
	const { pollID } = req.body;
	pool.query(
		`SELECT "questionIDs"
		FROM templates
		WHERE id = (
			SELECT "templateID"
			FROM polls
			WHERE id = $1
		)`,
		[pollID],
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
								order: q0_res.rows[0].questionIDs,
								questions: q1_res.rows,
								required: q1_res.rows.reduce((acc, cv) => {
									if (cv.required === true) {
										acc.push(cv.id);
									}
									return acc;
								}, [])
							});
						}
					}
				);
			}
		}
	);
});

router.post(`/retrieve_student_polls`, (req, res, next) => {
	const { pollIDs } = req.body;
	pool.query(
		`SELECT
			id,
			"pollTitle",
			"creator",
			"templateID"
		FROM polls
		WHERE id = ANY($1)`,
		[pollIDs],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			res.json({
				completed: true,
				polls: q_res.rows.reduce((acc, item) => {
					acc[item.id] = item;
					return acc;
				}, {})
			});
		}
	);
});

module.exports = router;
