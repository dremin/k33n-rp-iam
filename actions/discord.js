'use strict';
const request = require('../common/jsonRequest');
const config = require('../common/config').config;
const apiKey = config.discord.apiKey;
const getIdUrl = 'https://discordapp.com/api/guilds/' + config.discord.guildId + '/members?limit=1000';
const giveRoleUrl = 'https://discordapp.com/api/guilds/' + config.discord.guildId + '/members/';

exports.giveRole = (userTag, roleId) => {
	return new Promise((resolve, reject) => {
		request.get(getIdUrl, { 'Authorization': 'Bot ' + apiKey }).then((data) => {
			// check all members to see if ours is here
			var found = false;
			data.forEach((member) => {
				if ((member.user.username + '#' + member.user.discriminator) == userTag) {
					// match!
					found = true;
					request.put(giveRoleUrl + member.user.id + '/roles/' + roleId, { 'Authorization': 'Bot ' + apiKey }).then((data) => {
						// done!
						resolve();
						return;
					},
					(reason) => {
						// discord api error
						console.log(reason);
						reject("Discord API error");
					});
				}
			});
			
			if (!found) {
				reject("User not in Discord");
			}
		},
		(reason) => {
			// discord api error
			reject("Discord API error");
		});
	});
}