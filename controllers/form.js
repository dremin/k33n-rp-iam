'use strict';
const config = require('../common/config').config;
const db = require('../common/db');
const auth = require('../common/auth');
const fs = require('fs');

exports.get = (req, res) => {
	db.query('select id, name, description, requireDiscord, requireSteam from forms where id = ' + db.escape(req.params.formName)).then((result) => {
		if (result.length > 0) {
			var contents = fs.readFileSync("forms/" + result[0].name + ".json");
			var template = JSON.parse(contents);
			
			template.description = !!result[0].description;
			template.formId = result[0].id;
			template.requireDiscord = !!result[0].requireDiscord;
			template.requireSteam = !!result[0].requireSteam;
			
			res.json(template);
		} else {
			res.status(400).json({ message: 'Invalid form name' })
		}
	},
	(reason) => {
		res.status(400).json(reason);
	});
};

exports.getDescription = (req, res) => {
	db.query('select name from forms where id = ' + db.escape(req.params.formName)).then((result) => {
		if (result.length > 0) {
			var contents = fs.readFileSync("forms/" + result[0].name + ".htm", "utf8");
			res.send(contents);
		} else {
			res.status(400).json({ message: 'Invalid form name' })
		}
	},
	(reason) => {
		res.status(400).json(reason);
	});
};