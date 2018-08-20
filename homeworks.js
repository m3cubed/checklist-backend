const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM homeworks`,
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
        FROM homeworks
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					homeworks: q_res.rows.reduce((acc, cv) => {
						acc[cv.id] = cv;
						return acc;
					}, {})
				});
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { homework } = req.body;
	let count = 1;
	const inserts = Object.keys(homework).reduce(
		(acc, cv) => {
			if (homework[cv] !== "") {
				acc.value.push(`"${cv}"`);
				acc.count.push(`$${count}`);
				acc.array.push(homework[cv]);
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
		`INSERT INTO homeworks (${inserts.value})
		VALUES (${inserts.count})
		RETURNING *`,
		inserts.array,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					homework: q_res.rows[0]
				});
			}
		}
	);
});

module.exports = router;
