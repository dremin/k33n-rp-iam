'use strict';
const request = require('../common/jsonRequest');
const config = require('../common/config').config;
const apiKey = config.ips.apiKey;
const apiUrl = config.ips.baseUrl + 'core/members/';

exports.giveRole = (userId, roleId) => {
	return new Promise((resolve, reject) => {
		request.get(apiUrl + userId + "?key=" + apiKey, { }).then((data) => {
			
			var secGroups = [];
			
			data.secondaryGroups.forEach((secGroup) => {
				secGroups.push(secGroup.id);
			});
			
			if (!secGroups.includes(roleId)) secGroups.push(roleId);
			
			var groupStr = secGroups.map((el, idx) => {
				return 'secondaryGroups[' + idx + ']=' + el;
			}).join('&');
			
			request.post(apiUrl + userId + "?key=" + apiKey + "&" + groupStr, { }).then((data) => {
				// done!
				resolve();
				return;
			},
			(reason) => {
				// ips api error
				console.log(reason);
				reject("IPS API error");
			});
		},
		(reason) => {
			// ips api error
			reject("IPS API error");
		});
	});
}