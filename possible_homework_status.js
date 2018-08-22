const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM possible_homework_status`,
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
        FROM possible_homework_status
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				if (q_res.rows.length !== 0) {
					res.json({
						completed: true,
						status: q_res.rows.reduce((acc, cv) => {
							acc[cv.statusTitle] = cv;
							return acc;
						}, {})
					});
				} else {
					pool.query(
						`INSERT INTO possible_homework_status(
							"courseID",
							"statusTitle",
							"statusType",
							"completeSignal",
							"color"
						)
						VALUES(
							$1,
							'Complete',
							'Complete',
							true,
							'#c5e1a5'
						),
						(
							$1,
							'Incomplete',
							'Incomplete',
							false,
							'#ef9a9a'
						)
						RETURNING *`,
						[courseID],
						(q1_err, q1_res) => {
							if (q1_err) {
								return next(q1_err);
							} else {
								res.json({
									completed: true,
									status: q1_res.rows.reduce((acc, cv) => {
										acc[cv.statusTitle] = cv;
										return acc;
									}, {})
								});
							}
						}
					);
				}
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { status } = req.body;
	let count = 1;
	const inserts = Object.keys(status).reduce(
		(acc, cv) => {
			if (status[cv] !== "") {
				acc.value.push(`"${cv}"`);
				acc.count.push(`$${count}`);
				acc.array.push(status[cv]);
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
		`INSERT INTO possible_homework_status (${inserts.value})
		VALUES (${inserts.count})
		RETURNING *`,
		inserts.array,
		(q_err, q_res) => {
			console.log(q_err);
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					status: q_res.rows[0]
				});
			}
		}
	);
});

module.exports = router;
