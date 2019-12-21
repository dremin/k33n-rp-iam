'use strict';
const config = require('../common/config').config;
const db = require('../common/db');
const auth = require('../common/auth');

exports.getUserInfo = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		db.query('select steamid, userName, warns, banned from whitelist where userId = ' + db.escape(data.id)).then((result) => {
			if (result.length > 0) {
				var hex = result[0].steamid.split(':')[1];
				var charId = "%" + hex;
				var response = {
					hex: hex,
					userName: result[0].userName,
					warns: result[0].warns,
					banned: result[0].banned,
					characters: []
				};
				// TODO this assumes the FiveM DB is on the same server as IAM
				db.query("select concat(firstname, ' ', lastname) as charName, money, bank, dateofbirth, IF(sex = 'm', 'Male', 'Female') as sex, `jobs`.label as job, phone_number from essentialmode.users LEFT JOIN essentialmode.jobs on essentialmode.users.job = essentialmode.jobs.name where identifier like " + db.escape(charId) + " and firstname <> ''").then((result2) => {
					if (result2.length > 0) {
						response.characters = result2;
					}
					
					res.json(response);
				},
				(reason) => {
					res.status(400).json(reason);
				});
			} else {
				res.status(400).json({ message: 'Player not found' });
			}
		},
		(reason) => {
			res.status(400).json(reason);
		});
	});
};