const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM seating_positions`,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json(q_res.rows);
			}
		},
	);
});

router.put("/upsert", (req, res, next) => {
	const { seatingPositions, courseID } = req.body;

	pool.query(
		`INSERT INTO seating_positions (positions, "courseID")
			VALUES
				(
					$1,
					$2
				)
			ON CONFLICT ("courseID")
			DO
				UPDATE
					SET positions = $1`,
		[seatingPositions, courseID],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
		},
	);
});

router.put("/retrieve", (req, res, next) => {
	const { courseID } = req.body;
	pool.query(
		`SELECT *
        FROM seating_positions
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					seatingPositions: q_res.rows[0],
				});
			}
		},
	);
});

module.exports = router;
