'use strict';
const db = require('../common/db');
const discord = require('./discord');
const iam = require('./iam');
const ips = require('./ips');

exports.runActions = (appId) => {
	return new Promise((resolve, reject) => {
		// run actions based on form properties
		db.query('select a.discordName, a.steamHex, f.requireDiscord, f.discordRole, f.requireSteam, f.ipsGroupToSet, a.userId, a.userName from applications as a join forms as f on a.form = f.id where a.id = ' + db.escape(appId)).then((result) => {
			if (result.length > 0) {
				var validations = []
				var numValid = 0;
				
				// perform required actions
				// 1. discord role
				// 2. steam hex in iam
				giveIpsRole(validations, numValid, result[0], resolve, reject);
			} else {
				reject();
			}
		},
		(reason) => {
			reject(reason);
		});
	});
}

function giveIpsRole(validations, numValid, app, resolve, reject) {
	if (app.ipsGroupToSet != null && app.ipsGroupToSet > 0) {
		ips.giveRole(app.userId, app.ipsGroupToSet).then((ipsResult) => {
			validations.push({ type: 'gaveIpsRole', value: app.ipsGroupToSet, result: true });
			numValid++;
			giveDiscordRole(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			console.log(reason);
			validations.push({ type: 'gaveIpsRole', value: app.ipsGroupToSet, result: false });
			giveDiscordRole(validations, numValid, app, resolve, reject);
		});
	} else {
		giveDiscordRole(validations, numValid, app, resolve, reject);
	}
}

function giveDiscordRole(validations, numValid, app, resolve, reject) {
	if (app.requireDiscord == 1) {
		discord.giveRole(app.discordName, app.discordRole).then((discordResult) => {
			validations.push({ type: 'gaveDiscordRole', value: app.discordName, result: true });
			numValid++;
			addIamHex(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			validations.push({ type: 'gaveDiscordRole', value: app.discordName, result: false });
			addIamHex(validations, numValid, app, resolve, reject);
		});
	} else {
		addIamHex(validations, numValid, app, resolve, reject);
	}
}

function addIamHex(validations, numValid, app, resolve, reject) {
	if (app.requireSteam == 1) {
		iam.addWhitelist(app).then((steamResult) => {
			validations.push({ type: 'whitelist', value: app.steamHex, result: true });
			numValid++;
			complete(validations, numValid, app, resolve, reject);
		},
		(reason) => {
			validations.push({ type: 'whitelist', value: app.steamHex, result: false });
			complete(validations, numValid, app, resolve, reject);
		});
	} else {
		complete(validations, numValid, app, resolve, reject);
	}
}

function complete(validations, numValid, app, resolve, reject) {
	// are all items valid? if so, send success
	if (validations.length == numValid) {
		resolve({ validations: validations });
	} else {
		// send list of actions to tell user which failed
		reject({ validations: validations });
	}
}