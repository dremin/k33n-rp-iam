'use strict';
const request = require('../common/jsonRequest');
const config = require('../common/config').config;
const db = require('../common/db');
const apiKey = config.steamApiKey;
const url = 'http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=';
const BigNumber = require('bignumber.js');

exports.check = (steamHex) => {
	return new Promise((resolve, reject) => {
		// convert steam hex to dec
		var steamId = (new BigNumber(steamHex, 16)).toString(10);
		request.get(url + apiKey + '&steamids=' + steamId, {}).then((data) => {
			// check if user was found in steam and not banned
			if (data.players && data.players.length > 0) {
				if (data.players[0].SteamId == steamId && data.players[0].CommunityBanned == false && data.players[0].VACBanned == false) {
					// valid and not banned on steam. double check that they are not already banned on whitelist as well
					var steam = "steam:" + steamHex;
					db.query('select steamid from whitelist where steamid = ' + db.escape(steam) + ' and (warns > 2 or banned = 1)').then((result) => {
						if (result.length > 0) {
							reject("User banned on whitelist");
							return;
						} else {
							resolve();
							return;
						}
					},
					(reason) => {
						reject("Whitelist query error");
						return;
					});
					
				} else {
					reject("Steam user banned or not found");
					return;
				}
			} else {
				reject("Steam user not found");
				return;
			}
		},
		(reason) => {
			// steam api error
			reject("Steam API error");
			return;
		});
	});
}