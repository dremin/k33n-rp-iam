'use strict';
const db = require('../common/db');

exports.addWhitelist = (app) => {
	return new Promise((resolve, reject) => {
		// add user to whitelist
		var steam = "steam:" + app.steamHex;
		db.query('insert into whitelist (steamid, userId, userName) values (' + db.escape(steam) + ', ' + db.escape(app.userId) + ', ' + db.escape(app.userName) + ')').then((result) => {
			resolve();
			console.log('Approved application whitelisted hex ' + steam);
		},
		(reason) => {
			if (reason.code == 'ER_DUP_ENTRY') {
				// already whitelisted, no need to fail
				resolve();
			}
			reject(reason);
		});
	});
}