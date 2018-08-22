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

router.put("/upsert", (req, res, next) => {
	const { statusList, courseID } = req.body;

	Object.keys(statusList).forEach(hwID => {
		pool.query(
			`INSERT INTO student_homework_status (data, "homeworkID", "courseID")
			VALUES
				(
					$1,
					$2,
					$3
				)
			ON CONFLICT ("homeworkID")
			DO
				UPDATE
					SET data = $1`,
			[statusList[hwID], hwID, courseID],
			(q_err, q_res) => {
				if (q_err) return next(err);
			}
		);
	});
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
						acc[cv.homeworkID] = cv.data;
						return acc;
					}, {})
				});
			}
		}
	);
});

module.exports = router;
