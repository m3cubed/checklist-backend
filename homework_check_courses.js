// import { insertReducer } from "./reducers";
const { insertReducer, updateReducer } = require("./reducers");
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
		},
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
					}, {}),
				});
			}
		},
	);
});

router.post("/new", (req, res, next) => {
	const { course } = req.body;

	const reduced = insertReducer([course]);

	pool.query(
		`INSERT INTO homework_check_courses(${reduced.columns})
		VALUES ${reduced.values}
		RETURNING*`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			res.json({
				completed: true,
				course: q_res.rows[0],
			});
		},
	);

	// let count = 1;
	// const inserts = Object.keys(course).reduce(
	// 	(acc, cv) => {
	// 		if (course[cv] !== "") {
	// 			acc.value.push(`"${cv}"`);
	// 			acc.count.push(`$${count}`);
	// 			acc.array.push(course[cv]);
	// 			count++;
	// 		}
	// 		return acc;
	// 	},
	// 	{
	// 		value: [],
	// 		count: [],
	// 		array: [],
	// 	},
	// );

	// inserts.value = inserts.value.join(", ");
	// inserts.count = inserts.count.join(", ");

	// pool.query(
	// 	`INSERT INTO homework_check_courses (${inserts.value})
	// 	VALUES (${inserts.count})
	// 	RETURNING *`,
	// 	inserts.array,
	// 	(q_err, q_res) => {
	// 		if (q_err) {
	// 			return next(q_err);
	// 		} else {
	// 			res.json({
	// 				completed: true,
	// 				course: q_res.rows[0],
	// 			});
	// 		}
	// 	},
	// );
});

router.put("/update", (req, res, next) => {
	const { course } = req.body;
	console.log(course);
	// let count = 1;
	// const inserts = Object.keys(course).reduce(
	// 	(acc, cv) => {
	// 		if (course[cv] !== "" && cv !== "id") {
	// 			acc.value.push(`"${cv}"`);
	// 			acc.count.push(`$${count}`);
	// 			acc.array.push(course[cv]);
	// 			count++;
	// 		}
	// 		return acc;
	// 	},
	// 	{
	// 		value: [],
	// 		count: [],
	// 		array: [],
	// 	},
	// );

	// inserts.value = inserts.value.join(", ");
	// inserts.count = inserts.count.join(", ");

	const reduced = updateReducer(course, [course.id]);

	console.log(reduced);

	pool.query(
		`UPDATE homework_check_courses
		SET ${reduced.set}
		WHERE id = '${course.id}'
		RETURNING *`,
		(q_err, q_res) => {
			if (q_err) {
				return next(q_err);
			}
			res.json({
				completed: true,
				course: q_res.rows[0],
			});
		},
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
					errpr: q_err,
				});
				return next(q_err);
			}

			res.json({ completed: true });
		},
	);
});

router.put("/duplicate_course", (req, res, next) => {
	const { course } = req.body;
	course.courseTitle = `${course.courseTitle}*new*`;
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
			array: [],
		},
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
				const newCourse = q_res.rows[0];

				let toReplicate = {};
				new Promise((resolve, reject) => {
					client.connect((err, client, release) => {
						if (err) return next(err);
						client.query(`BEGIN`);

						client.query(
							`SELECT *
						FROM homeworks
						WHERE "courseID" = $1`,
							[course.id],
							(q1_err, q1_res) => {
								if (q1_err) {
									release();
									reject();
									return next(q1_err);
								}

								toReplicate.homeworks = q1_res.rows[0];
							},
						);

						client.query(
							`SELECT *
						FROM homework_check_units
						WHERE "courseID" = $1`,
							[course.id],
							(q2_err, q2_res) => {
								if (q2_err) {
									release();
									reject();
									return next(q2_err);
								}

								toReplicate.hwUnits = q2_res.rows[0];
							},
						);

						client.query(
							`SELECT *
						FROM possible_homework_status
						WHERE "courseID" = $1`,
							[course.id],
							(q3_err, q3_res) => {
								if (q3_err) {
									release();
									reject();
									return next(q3_err);
								}

								toReplicate.hwStatus = q3_res.rows[0];
							},
						);

						client.query(`COMMIT`, (q4_err, q4_res) => {
							if (q4_err) {
								release();
								reject();
								return next(q4_err);
							}
							resolve();
						});
					});
				}).then(() => {});
			}
		},
	);
});

module.exports = router;
