'use strict';
const db = require('../common/db');
const cad = require('./cad');
const discord = require('./discord');
const steam = require('./steam');

exports.checkValidators = (appId) => {
	return new Promise((resolve, reject) => {
		// run validators based on form properties
		db.query('select a.userId, a.charName, a.discordName, a.steamHex, f.requireCad, f.requireDiscord, f.requireSteam, f.name as formName, f.label as formLabel from applications as a join forms as f on a.form = f.id where a.id = ' + db.escape(appId)).then((result) => {
			if (result.length > 0) {
				var validations = []
				var numValid = 0;
				
				// perform required checks
				// 1. cad
				// 2. discord
				// 3. steam
				checkCad(validations, numValid, result[0], resolve, reject);
			} else {
				reject();
			}
		},
		(reason) => {
			reject(reason);
		});
	});
}

function checkCad(validations, numValid, app, resolve, reject) {
	if (app.requireCad == 1) {
		cad.check(app.charName).then((cadResult) => {
			validations.push({ type: 'cad', value: app.charName, result: true });
			numValid++;
			checkDiscord(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			validations.push({ type: 'cad', value: app.charName, result: false });
			checkDiscord(validations, numValid, app, resolve, reject);
		});
	} else {
		checkDiscord(validations, numValid, app, resolve, reject);
	}
}

function checkDiscord(validations, numValid, app, resolve, reject) {
	if (app.requireDiscord == 1) {
		discord.check(app.discordName).then((discordResult) => {
			validations.push({ type: 'discord', value: app.discordName, result: true });
			numValid++;
			checkSteam(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			validations.push({ type: 'discord', value: app.discordName, result: false });
			checkSteam(validations, numValid, app, resolve, reject);
		});
	} else {
		checkSteam(validations, numValid, app, resolve, reject);
	}
}

function checkSteam(validations, numValid, app, resolve, reject) {
	if (app.requireSteam == 1) {
		steam.check(app.steamHex).then((steamResult) => {
			validations.push({ type: 'steam', value: app.steamHex, result: true });
			numValid++;
			complete(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			validations.push({ type: 'steam', value: app.steamHex, result: false });
			complete(validations, numValid, app, resolve, reject);
		});
	} else {
		complete(validations, numValid, app, resolve, reject);
	}
}

function complete(validations, numValid, app, resolve, reject) {
	// are all items valid? if so, perform approval actions
	if (validations.length == numValid) {
		resolve({ validations: validations, userId: app.userId, formLabel: app.formLabel, formName: app.formName });
	} else {
		// send list of validations to tell user which failed
		reject({ validations: validations, userId: app.userId, formLabel: app.formLabel, formName: app.formName });
	}
}