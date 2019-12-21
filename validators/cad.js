'use strict';
const request = require('../common/jsonRequest');
const config = require('../common/config').config;
const apiKey = config.bubbleCad.apiKey;
const url = config.bubbleCad.baseUrl + 'obj/' + config.bubbleCad.entityType + '?constraints=%5B%7B%22key%22%3A%22' + config.bubbleCad.entityKey + '%22%2C%22constraint_type%22%3A%22equals%22%2C%20%22value%22%3A%22';

exports.check = (charName) => {
	return new Promise((resolve, reject) => {
		request.get(url + charName + '%22%7D%5D', { 'Authorization': 'Bearer ' + apiKey }).then((data) => {
			// check if civ user was found in cad
			if (data.response && data.response.results && data.response.results.length > 0) {
				if (data.response.results[0].name == charName) {
					resolve();
					return;
				} else {
					reject("User not found");
					return;
				}
			} else {
				reject("User not found");
				return;
			}
		},
		(reason) => {
			// bubble api error
			reject("Bubble API error");
			return;
		});
	});
}