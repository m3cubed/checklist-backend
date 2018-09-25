const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./user");
const cors = require("cors");
const templates = require("./templates");
const questions = require("./questions");
const courses = require("./courses");
const polls = require("./polls");
const user_poll_responses = require("./user_poll_responses");
const students = require("./students");
const homework_check_courses = require("./homework_check_courses");
const homework_check_units = require("./homework_check_units");
const homeworks = require("./homeworks");
const possible_homework_status = require("./possible_homework_status");
const student_homework_status = require("./student_homework_status");
const seating_positions = require("./seating_positions");
const responses = require("./responses");
const collaborate = require("./collaborate");

const app = express();

const whitelist = [
	"http://localhost:3000",
	"https://folio-productions-fa-frontend.herokuapp.com",
	"https://folio.academy",
	"https://www.folio.academy",
	"http://www.folio.academy",
	"http://folio.academy",
];

const corsOption = {
	origin:
		process.env.NODE_ENV === "production"
			? (origin, callback) => {
					if (whitelist.indexOf(origin) !== -1 || !origin) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
			  }
			: "http://localhost:3000",
	credentials: true,
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOption));

app.use("/user", user);
app.use("/courses", courses);
app.use("/templates", templates);
app.use("/questions", questions);
app.use("/polls", polls);
app.use("/user_poll_responses", user_poll_responses);
app.use("/responses", responses);
app.use("/students", students);
app.use("/homework_check_courses", homework_check_courses);
app.use("/homework_check_units", homework_check_units);
app.use("/homeworks/", homeworks);
app.use("/possible_homework_status", possible_homework_status);
app.use("/student_homework_status", student_homework_status);
app.use("/seating_positions", seating_positions);
app.use("/collaborate", collaborate);

app.use((err, req, res, next) => {
	if (!err.statusCode) err.statusCode = 500;

	res.status(err.statusCode).json({
		type: "error",
		msg: err.message,
	});
});

module.exports = app;
