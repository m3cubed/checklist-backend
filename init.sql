CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

CREATE TABLE users
(
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
    username_hash CHAR(64),
    password_hash CHAR(64) NOT NULL,
    email_hash CHAR(64) NOT NULL,
    session_id CHAR(36),
    gender VARCHAR,
    medical JSONb DEFAULT '{}' NOT NULL,
    "isAuth" BOOLEAN DEFAULT false,
    "status" VARCHAR,
    "userFirstName" VARCHAR NOT NULL,
    "userLastName" VARCHAR NOT NULL,
    "templateIDs" JSONB DEFAULT '{}' NOT NULL,
    "courseIDs" JSONB DEFAULT '{}' NOT NULL,
    "requestedCourses" JSONB DEFAULT '{}' NOT NULL,
    "todoPolls" JSONB DEFAULT '{}' NOT NULL
);

CREATE TABLE templates
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "templateTitle" VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    creator VARCHAR,
    "creatorID" uuid REFERENCES users(id),
    "questionIDs" JSONB DEFAULT '{}' NOT NULL,
    stage VARCHAR,
    PRIMARY KEY (id, "creatorID")
);

CREATE TABLE questions
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "questionTitle" VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "templateID" uuid REFERENCES templates(id),
    "required" BOOLEAN,
    format JSONB DEFAULT '{}' NOT NULL,
    answer JSONB DEFAULT '{}' NOT NULL,
    PRIMARY KEY(id, "templateID")
);

CREATE TABLE courses
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "courseTitle" VARCHAR,
    "courseCode" VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    creator VARCHAR,
    "creatorID" uuid REFERENCES users(id),
    students JSONB DEFAULT '{}' NOT NULL,
    "pollIDs" JSONB DEFAULT '{}' NOT NULL,
    PRIMARY KEY(id, "creatorID")
);

CREATE TABLE polls
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "pollTitle" VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "dateSent" VARCHAR,
    creator VARCHAR,
    "creatorID" uuid REFERENCES users(id),
    "templateID" uuid REFERENCES templates(id),
    students JSONB DEFAULT '{}' NOT NULL,
    PRIMARY KEY (id, "creatorID", "templateID")
);

CREATE TABLE user_poll_responses
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    completed BOOLEAN,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "pollID" uuid REFERENCES polls(id),
    "creatorID" uuid REFERENCES users(id),
    PRIMARY KEY (id, "pollID", "creatorID"),
    UNIQUE("pollID", "creatorID")
);

CREATE TABLE responses
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "questionID" uuid REFERENCES questions(id),
    "pollResponseID" uuid REFERENCES user_poll_responses(id),
    answer JSONB DEFAULT '{}' NOT NULL,
    PRIMARY KEY (id, "questionID", "pollResponseID"),
    UNIQUE("questionID", "pollResponseID")
);

/*HOMEWORK CHECK*/

CREATE TABLE homework_folders
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "folderTitle" VARCHAR,
    "creatorID" uuid REFERENCES users(id),
    PRIMARY KEY (id, "creatorID"),
    UNIQUE ("creatorID", "folderTitle")
);

CREATE TABLE homework_check_courses
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "creatorID" uuid REFERENCES users(id),
    "courseTitle" VARCHAR,
    grade VARCHAR,
    subject VARCHAR,
    "startDate" VARCHAR,
    "endDate" VARCHAR,
    "semester" VARCHAR,
    "folderID" uuid REFERENCES homework_folders(id),
    "courseDescription" VARCHAR,
    PRIMARY KEY (id, "creatorID"),
    UNIQUE (id, "creatorID")
);

CREATE TABLE students
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "firstName" VARCHAR NOT NULL,
    "lastName" VARCHAR NOT NULL,
    gender VARCHAR,
    "studentCode" VARCHAR,
    "parentEmail" VARCHAR,
    "courseID" uuid REFERENCES homework_check_courses(id),
    PRIMARY KEY (id, "courseID")
);

CREATE TABLE homework_check_units
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "courseID" uuid REFERENCES homework_check_courses(id),
    "unitTitle" VARCHAR,
    "unitStartDate" VARCHAR,
    "unitEndDate" VARCHAR,
    "unitDescription" VARCHAR,
    PRIMARY KEY (id, "courseID"),
    UNIQUE (id, "courseID")
);

CREATE TABLE possible_homework_status
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "courseID" uuid REFERENCES homework_check_courses(id),
    "statusTitle" VARCHAR NOT NULL,
    "statusDescription" VARCHAR,
    "statusType" VARCHAR NOT NULL,
    "completeSignal" BOOLEAN DEFAULT NULL,
    color VARCHAR NOT NULL,
    PRIMARY KEY (id, "courseID"),
    UNIQUE (id, "courseID", "statusTitle"),
    UNIQUE ("courseID", "completeSignal")
);

CREATE TABLE homeworks
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "courseID" uuid REFERENCES homework_check_courses(id),
    "unitID" uuid REFERENCES homework_check_units(id),
    "homeworkTitle" VARCHAR,
    "submitDate" VARCHAR NOT NULL,
    PRIMARY KEY (id, "courseID", "unitID"),
    UNIQUE(id, "courseID"),
    UNIQUE("homeworkTitle", "unitID")
);

CREATE TABLE student_homework_status
(
    id uuid DEFAULT uuid_generate_v4() UNIQUE,
    "data" JSONB NOT NULL DEFAULT '{}',
    "courseID" uuid REFERENCES homework_check_courses(id),
    "homeworkID" uuid REFERENCES homeworks(id),
    PRIMARY KEY (id, "courseID"),
    UNIQUE("courseID", "homeworkID")
);

/*INSERTS*/

INSERT INTO users
    (id, username_hash, password_hash, email_hash, gender, "isAuth", "status", "userFirstName", "userLastName", "requestedCourses", "courseIDs", "templateIDs")
VALUES
    (
        'baaa31d9-399a-4bd8-9993-a71e60eb18a9',
        'afc6f36f653ebe2002e27f2b45856411a5a8c65a43e432ec46678a7295343aaa',
        '5bcc1bd060b3d6e7415b69c5a74fddd90c071f7f2c5550861107edf565d99250',
        '07ca57c3053e52564226f58e31a135b2025ce665d8e9ea3589fe070d4d1dc654',
        'male',
        true,
        'teacher',
        'Foo',
        'Bar',
        '{}',
        '{
        "015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5" : 1
    }',
        '{
        "60f472ce-da0d-4bf5-ace0-1efea831af0e": 1
    }'
),
    (
        '35c120ef-789f-440d-a1eb-473ba1b8902e',
        '7fff2555d3d6513b542045de2a8600000e5568d15b355508a9a649c7043935ea',
        '5bcc1bd060b3d6e7415b69c5a74fddd90c071f7f2c5550861107edf565d99250',
        '7b56972e49d2ed53c5302ed430cd9d9cbabdaebca5ab4f0795cfe6fa6d6c286d',
        'male',
        true,
        'student',
        'John',
        'Doe',
        '{
        "015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5": "Confirmed"
    }',
        '{
        "015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5" : 1
    }',
        '{}'
),
    (
        '8c1ad40f-d2d2-45bf-88e7-4f5bababd99c',
        'e29e3684c6c787ad00c908ceb32218fc4a0724727571678eb265391b75fc4cae',
        '5bcc1bd060b3d6e7415b69c5a74fddd90c071f7f2c5550861107edf565d99250',
        '8f9a3412dbdac5a86c71f3d76ba690c853c93933625ab57138e1925bc0785c7a',
        'female',
        true,
        'student',
        'Jane',
        'Smith',
        '{
        "015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5" : "Confirmed"
    }',
        '{
        "015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5" : 1
    }',
        '{}'
),
    (
        'ecb389bd-b1a4-4e3e-8dec-b0e9dcba8914',
        '9bd1a9785c4d7649fbd9560d9eb31475c01a08d2f9bf9319aa3006b5ccb6800f',
        '5bcc1bd060b3d6e7415b69c5a74fddd90c071f7f2c5550861107edf565d99250',
        'f19169de22691162b129b9faea6ffe2015379e5059ffbd084d2c24d0e292fb13',
        'female',
        true,
        'student',
        'Jane',
        'Doe',
        '{}',
        '{}',
        '{}'
    
);

INSERT INTO courses
    (id, "courseTitle", "courseCode", creator, "creatorID", students)
VALUES
    (
        '015c6262-b6f9-4ac7-b6ca-1ae098b4fbd5',
        'Test Course 1',
        'test-course-01',
        'Bar, Foo',
        'baaa31d9-399a-4bd8-9993-a71e60eb18a9',
        '{
        "35c120ef-789f-440d-a1eb-473ba1b8902e" : {
            "confirmed" : true
        },
        "8c1ad40f-d2d2-45bf-88e7-4f5bababd99c" : {
            "confirmed" : true
        }
    }'
);

INSERT INTO templates
    (id, "templateTitle", creator, "creatorID", "questionIDs")
VALUES
    (
        '60f472ce-da0d-4bf5-ace0-1efea831af0e',
        'Test Template',
        'Bar, Foo',
        'baaa31d9-399a-4bd8-9993-a71e60eb18a9',
        '{
        "1ef6d571-42e0-432a-b753-84e01cafc5af" : 1,
        "3e898cb5-7b61-4517-b4de-21622286c94f" : 2
    }'
);

INSERT INTO questions
    (id, "questionTitle", "required", "templateID", format)
VALUES
    (
        '1ef6d571-42e0-432a-b753-84e01cafc5af',
        'Question 1',
        'true',
        '60f472ce-da0d-4bf5-ace0-1efea831af0e',
        '{
        "type" : "rating",
        "details" : {
            "min" : 1,
            "max" : 10
        }
    }'
),
    (
        '3e898cb5-7b61-4517-b4de-21622286c94f',
        'Question 2',
        'false',
        '60f472ce-da0d-4bf5-ace0-1efea831af0e',
        '{
        "type" : "multiple-choice",
        "details" : {
            "choiceNUM" : 4,
            "choices" : {
                "choice0" : "A",
                "choice1" : "B",
                "choice2" : "C",
                "choice3" : "D"
            }
        }
    }'
);