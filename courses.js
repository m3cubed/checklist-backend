const pool = require("./db");
const { Router } = require("express");

const router = new Router();

router.get("/all", (req, res, next) => {
	pool.query(
		`SELECT * 
        FROM courses`,
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json(q_res.rows);
		}
	);
});

router.get("/retrieve", (req, res, next) => {
	const { id } = req.body;
	pool.query(
		`SELECT *
		FROM courses
		WHERE id = $1`,
		[id],
		(q0_err, q0_res) => {
			if (q0_err) {
				return next(q0_err);
			} else {
				return res.json({ ...q0_res.rows[0] });
			}
		}
	);
});

router.post("/new", (req, res, next) => {
	const { courseTitle, courseCode, creator, creatorID, length } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		//add course into course list
		client.query(
			`INSERT 
            INTO courses("courseTitle", "courseCode", creator, "creatorID") 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
			[courseTitle, courseCode, creator, creatorID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				} else {
					const courseIDs = {
						[q0_res.rows[0].id]: length
					};
					//add courseID into user's course list
					client.query(
						`UPDATE users 
                        SET "courseIDs" = "courseIDs" || (VALUES ($1))::jsonb 
                        WHERE id = $2`,
						[{ [q0_res.rows[0].id]: length }, creatorID],
						(q1_err, q1_res) => {
							release();
							if (q1_err) {
								return next(q1_err);
							} else {
								res.json({
									completed: true,
									course: q0_res.rows[0]
								});
							}
						}
					);
				}
			}
		);
	});
});

router.put("/find", (req, res, next) => {
	const { accessID } = req.body;

	pool.query(
		`SELECT *
		FROM courses
		WHERE id = $1`,
		[accessID],
		(q_err, q_res) => {
			if (q_err) return next(q_err);

			res.json({
				completed: true,
				course: q_res.rows[0]
			});
		}
	);
});

router.put("/students/request", (req, res, next) => {
	const { courseID, studentID } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query(`BEGIN`);
		//update course to add studentID into students list as unconfirmed
		client.query(
			`UPDATE courses 
            SET students = students || (VALUES($1))::jsonb 
            WHERE id = $2`,
			[{ [studentID]: { confirmed: false } }, courseID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				}
			}
		);
		//update student to add courseID into requested list
		client.query(
			`UPDATE users 
            SET "requestedCourses" = "requestedCourses" || (VALUES($1))::jsonb 
            WHERE id = $2`,
			[{ [courseID]: "Requested" }, studentID],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				}
			}
		);
		client.query(`COMMIT`, (q2_err, q2_res) => {
			release();
			if (q2_err) {
				return next(q2_err);
			} else {
				res.json({ completed: true });
			}
		});
	});
});

router.put(`/students/confirm`, (req, res, next) => {
	const { courseID, studentID, length } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);
		client.query(`BEGIN`);

		client.query(
			`UPDATE users 
            SET 
                "requestedCourses" = "requestedCourses" - (VALUES($1)) || (VALUES($2))::jsonb, 
                "courseIDs" = "courseIDs" || (VALUES($3))::jsonb 
            WHERE id = $4`,
			[
				courseID,
				{ [courseID]: "Confirmed" },
				{ [courseID]: length },
				studentID
			],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				}
			}
		);

		client.query(
			`UPDATE courses 
            SET students = students - (VALUES($1)) || (VALUES($2))::jsonb 
            WHERE id = $3`,
			[studentID, { [studentID]: { confirmed: true } }, courseID],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				}
			}
		);

		client.query(`COMMIT`, (q2_err, q2_res) => {
			release();
			if (q2_err) {
				return next(q2_err);
			} else {
				res.json({ completed: true });
			}
		});
	});
});

router.put("/delete", (req, res, next) => {
	const { id, students, creatorID } = req.body;

	pool.connect((err, client, release) => {
		if (err) return next(err);

		client.query(`BEGIN`);
		//Delete course ID from creator's course list
		client.query(
			`UPDATE users 
			SET "courseIDs" = "courseIDs" - (VALUES($1)) 
			WHERE id = $2`,
			[id, creatorID],
			(q0_err, q0_res) => {
				if (q0_err) {
					release();
					return next(q0_err);
				}
			}
		);
		//Delete course ID from student's course list and requested list
		client.query(
			`UPDATE users 
			SET "courseIDs" = "courseIDs" - (VALUES($1)), 
			"requestedCourses" = "requestedCourses" - (VALUES($1)) 
			WHERE id = ANY ($2)`,
			[id, Object.keys(students)],
			(q1_err, q1_res) => {
				if (q1_err) {
					release();
					return next(q1_err);
				}
			}
		);
		//Delete the course with course ID
		client.query(
			`DELETE FROM courses WHERE id = $1`,
			[id],
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
				res.json({ completed: true });
			}
		});
	});
});

router.post(`/retrieve_student_courses`, (req, res, next) => {
	const { courseIDs } = req.body;

	pool.query(
		`SELECT id, "courseTitle", "courseCode", creator
		FROM courses
		WHERE id = ANY($1)`,
		[courseIDs],
		(q_err, q_res) => {
			if (q_err) return next(q_err);
			res.json({
				completed: true,
				courses: q_res.rows.reduce((acc, item) => {
					acc[item.id] = item;
					return acc;
				}, {})
			});
		}
	);
});

router.get(`/get_students`, (req, res, next) => {
	const id = req.headers.referer.replace(`${req.headers.origin}/class/`, "");

	pool.query(
		`SELECT students
		FROM courses
		WHERE id = $1`,
		[id],
		(q0_err, q0_res) => {
			if (q0_err) return next(q0_err);

			pool.query(
				`SELECT
					id,
					gender, 
					medical, 
					"isAuth", 
					status, 
					"userFirstName", 
					"userLastName", 
					"todoPolls"
				FROM users
				WHERE id = ANY($1)`,
				[Object.keys(q0_res.rows[0].students)],
				(q1_err, q1_res) => {
					if (q1_err) return next(q1_err);

					res.json({
						completed: true,
						students: q1_res.rows.reduce((acc, item) => {
							acc[item.id] = item;
							return acc;
						}, {})
					});
				}
			);
		}
	);
});

router.put(`/retrieve_poll_responses`, (req, res, next) => {
	const { pollIDs } = req.body;

	pool.query(
		`SELECT *
		FROM user_poll_responses
		WHERE "pollID" = ANY($1)`,
		[pollIDs],
		(q_err, q_res) => {
			if (q_err) {
				return next(err);
			} else {
				res.json({
					completed: true,
					responses: q_res.rows.reduce((acc, cv) => {
						acc[cv.id] = cv;
						return acc;
					}, {})
				});
			}
		}
	);
});

module.exports = router;
