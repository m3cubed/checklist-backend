const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM student_homework_status`,
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
        FROM student_homework_status
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					studentHWStatus: q_res.rows.reduce((acc, cv) => {
						const homeworkID = acc[cv.homeworkID];

						acc[cv.homeworkID] = homeworkID
							? {
									...homeworkID,
									[cv.homeworkID]: cv.data
							  }
							: cv;
						return acc;
					}, {})
				});
			}
		}
	);
});

module.exports = router;
