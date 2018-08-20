const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM students`,
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
	const { courseID } = req.body;

	pool.query(
		`SELECT *
        FROM students
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					students: q_res.rows.reduce((acc, cv) => {
						acc[cv.id] = cv;
						return acc;
					}, {})
				});
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { student } = req.body;
	let count = 1;
	const inserts = Object.keys(student).reduce(
		(acc, cv) => {
			if (student[cv] !== "") {
				acc.value.push(`"${cv}"`);
				acc.count.push(`$${count}`);
				acc.array.push(student[cv]);
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
		`INSERT INTO students (${inserts.value})
		VALUES (${inserts.count})
		RETURNING *`,
		inserts.array,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					student: q_res.rows[0]
				});
			}
		}
	);
});

module.exports = router;
