const update = require("immutability-helper");

function insertReducer(objects, filters) {
	let newObjects = [];
	if (filters) {
		objects.forEach(object => {
			newObjects.push(update(object, { $unset: filters }));
		});
	} else {
		newObjects = objects;
	}

	let columns = [];
	let values = [];

	newObjects.forEach((object, index) => {
		const keys = Object.keys(object);
		if (index === 0) {
			columns = keys;
		}

		let temp = keys.reduce((acc, cv) => {
			const val = object[cv];
			if (val === false || val === true) {
				//Push value if boolean without single quotes
				acc.push(val);
			} else if (val !== "") {
				//Push value if exists and not boolean
				acc.push(`'${val}'`);
			} else {
				//Push to null if column is empty. Column cannot accept null values.
				acc.push("null");
			}
			return acc;
		}, []);

		temp = temp.join(`, `);
		values.push(`(${temp})`);
	});

	columns = `"${columns.join(`", "`)}"`;
	values = values.join(", ");

	return { columns, values };
}

function updateReducer(object, filters = []) {
	const newObject = Object.keys(object).reduce((acc, cv) => {
		if (filters.includes(cv) === false && object[cv] !== null) {
			acc[cv] = object[cv];
		}
		return acc;
	}, {});

	const keys = Object.keys(newObject);

	columns = keys;

	let set = keys.reduce((acc, cv) => {
		const val = object[cv];
		if (val === false || val === true) {
			//Push value if boolean without single quotes
			acc.push(`"${cv}" = ${val}`);
		} else if (val !== "") {
			//Push value if exists and not boolean
			acc.push(`"${cv}" = '${val}'`);
		} else {
			//Push to null if column is empty. Column cannot accept null values.
			acc.push(`"${cv}" = null`);
		}
		return acc;
	}, []);

	set = set.join(`, `);

	return { set };
}

module.exports = { insertReducer, updateReducer };
