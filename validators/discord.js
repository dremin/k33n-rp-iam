'use strict';
const request = require('../common/jsonRequest');
const config = require('../common/config').config;
const apiKey = config.discord.apiKey;
const url = 'https://discordapp.com/api/guilds/' + config.discord.guildId + '/members?limit=1000';

exports.check = (userTag) => {
	return new Promise((resolve, reject) => {
		request.get(url, { 'Authorization': 'Bot ' + apiKey }).then((data) => {
			// check all members to see if ours is here
			data.forEach((member) => {
				if ((member.user.username + '#' + member.user.discriminator) == userTag) {
					// match!
					resolve();
					return;
				}
			});
			
			reject("User not in Discord");
		},
		(reason) => {
			// discord api error
			reject("Discord API error");
		});
	});
}