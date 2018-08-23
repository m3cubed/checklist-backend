const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM homework_check_courses`,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json(q_res.rows);
			}
		}
	);
});

router.put("/retrieve", (req, res, next) => {
	const { creatorID } = req.body;

	pool.query(
		`SELECT *
		FROM homework_check_courses
		WHERE "creatorID" = $1`,
		[creatorID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					courses: q_res.rows.reduce((acc, cv) => {
						acc[cv.id] = cv;
						return acc;
					}, {})
				});
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { course } = req.body;
	let count = 1;
	const inserts = Object.keys(course).reduce(
		(acc, cv) => {
			if (course[cv] !== "") {
				acc.value.push(`"${cv}"`);
				acc.count.push(`$${count}`);
				acc.array.push(course[cv]);
				count++;
			}
			return acc;
		},
		{
			value: [],
			count: [],
			array: []
		}
	);

	inserts.value = inserts.value.join(", ");
	inserts.count = inserts.count.join(", ");

	pool.query(
		`INSERT INTO homework_check_courses (${inserts.value})
		VALUES (${inserts.count})
		RETURNING *`,
		inserts.array,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					course: q_res.rows[0]
				});
			}
		}
	);
});

router.put("/update", (req, res, next) => {
	const { course } = req.body;
	let count = 1;
	const inserts = Object.keys(course).reduce(
		(acc, cv) => {
			if (course[cv] !== "" && cv !== "id") {
				acc.value.push(`"${cv}"`);
				acc.count.push(`$${count}`);
				acc.array.push(course[cv]);
				count++;
			}
			return acc;
		},
		{
			value: [],
			count: [],
			array: []
		}
	);

	inserts.value = inserts.value.join(", ");
	inserts.count = inserts.count.join(", ");

	pool.query(
		`UPDATE homework_check_courses
		SET (${inserts.value}) = (${inserts.count})
		WHERE id = '${course.id}'
		RETURNING *`,
		inserts.array,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			}
			res.json({
				completed: true,
				course: q_res.rows[0]
			});
		}
	);
});

router.put("/delete", (req, res, next) => {
	const { id } = req.body;

	pool.query(
		`DELETE
			FROM homework_check_courses
			WHERE id = $1`,
		[id],
		(q_err, q_res) => {
			if (q_err) {
				res.json({
					completed: false,
					errpr: q_err
				});
				return next(q_err);
			}

			res.json({ completed: true });
		}
	);
});

module.exports = router;
