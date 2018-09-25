const { insertReducer, updateReducer } = require("./reducers");

const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
		FROM collaborate`,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json(q_res.rows);
			}
		},
	);
});

router.put("/retrieve", (req, res, next) => {
	const { courseID } = req.body;

	pool.query(
		`SELECT *
        FROM collaborate
        WHERE "courseID" = $1`,
		[courseID],
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			} else {
				res.json({
					completed: true,
					collaborators: q_res.rows.reduce((acc, cv) => {
						acc[cv.id] = cv;
						return acc;
					}, {}),
				});
			}
		},
	);
});

router.post("/new", (req, res, next) => {
	const { collaborator } = req.body;

	const reduced = insertReducer([collaborator]);

	pool.query(
		`INSERT INTO collaborate(${reduced.columns})
		VALUES ${reduced.values}
		RETURNING*`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			res.json({
				completed: true,
				collaborator: q_res.rows[0],
			});
		},
	);
});

module.exports = router;
