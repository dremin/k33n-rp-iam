'use strict';
const config = require('./config').config;
const url = config.ips.baseUrl;
const apiKey = config.ips.apiKey;
const request = require('./jsonRequest');

// === auth cache - poor man's object schema ===
// {
//	token: string
//	timestamp: datetime
//	expires: int
//	status: int
//	user: IPSUser
// }
// yes, jsonRequest has a cache, but it keys off URL (which is the same per user for this request), rather than headers
// it might make sense to add a custom key option for jsonRequest cache, being the token, but I already wrote this, so
var authCache = [];

exports.ipsAuthCheck = (req, res) => {
	return new Promise((resolve, reject) => {
		var token = req.get('IPSauce');
		var expires = req.get('IPSauceExp');

		if (token == null || token == '') {
			if (config.debug) console.log("Missing secret");
		} else {
			var cacheItem;
			var now = Date.now();

			for (var i = authCache.length-1; i >= 0; i--) {
				// compare the inserted date plus expiration time to see if still valid item
				var newDate = new Date(authCache[i].timestamp + (authCache[i].expires * 1000));
				
				if (now >= newDate) {
					if (config.debug) console.log("Removing expired auth token");
					authCache.splice(i, 1);
				} else if (authCache[i].token == token) {
					// this is our guy
					cacheItem = authCache[i];
					break;
				}
			}

			if (cacheItem != null) {
				// we have a cached result that is not expired
				if (config.debug) console.log("Using cached auth data");
				if (cacheItem.status == 200) {
					resolve(cacheItem.user);
				} else {
					res.status(401).json({ message: 'Auth error' });
					reject();
				}
			} else {
				// we haven't seen this one before; get user info and save
				cacheItem = {
					token: token,
					expires: expires,
					timestamp: now
				};

				request.get(url + 'core/me', { 'Authorization': 'Bearer ' + token }).then((data) => {
					// authorized
					cacheItem.user = data;
					cacheItem.status = 200;
					authCache.push(cacheItem);
					if (config.debug) console.log("Adding successful authorization to cache");

					resolve(data);
				},
				(reason) => {
					// not authorized
					res.status(401).json({ message: 'Auth error' });
					if (config.debug) console.log("Incorrect or missing secret");
					if (config.debug) console.log("Adding failed authorization to cache");
					cacheItem.status = 401;
					authCache.push(cacheItem);

					reject();
				});
			}
		}
	});
}

exports.checkGroups = (req, res, user, groups, sendRes) => {
	return new Promise((resolve, reject) => {
		request.get(url + 'core/members/' + user + '?key=' + apiKey, {}, 900000).then((data) => {
			var foundGroups = [];
			var matchFound = false;
			
			// get primary group
			foundGroups.push(data.primaryGroup.id);
			// get all secondary groups
			data.secondaryGroups.forEach((secGroup) => {
				foundGroups.push(secGroup.id);
			});

			// check each given group if it is in the list of pri/sec groups
			groups.forEach((groupId) => {
				if (foundGroups.indexOf(groupId) >= 0) {
					matchFound = true;
				}
			});
			
			if (matchFound) {
				resolve();
			} else {
				// not authorized
				if (sendRes == true) {
					res.status(401).json({ message: 'Auth error' });
					if (config.debug) console.log("Missing group");
				}
				reject();
			}
		},
		(reason) => {
			// not authorized
			if (sendRes == true) {
				res.status(401).json({ message: 'Auth error' });
				if (config.debug) console.log("Missing group");
			}
			reject();
		});
	});
}

exports.getGroups = (req, res, user) => {
	return new Promise((resolve, reject) => {
		request.get(url + 'core/members/' + user + '?key=' + apiKey, {}, 900000).then((data) => {
			var foundGroups = [];
			
			// get primary group
			foundGroups.push(data.primaryGroup.id);
			// get all secondary groups
			data.secondaryGroups.forEach((secGroup) => {
				foundGroups.push(secGroup.id);
			});
			
			resolve(foundGroups);
		},
		(reason) => {
			// not authorized
			res.status(401).json({ message: 'Auth error' });
			if (config.debug) console.log("Incorrect or missing secret");
			reject();
		});
	});
}

exports.sendPm = (sender, to, title, body) => {
	return new Promise((resolve, reject) => {
		request.post(url + 'core/messages/?key=' + apiKey + '&' + encodeURIComponent('from=' + sender + '&to[0]=' + to + '&title=' + title + '&body=' + body), '').then((data) => {
			resolve();
		},
		(reason) => {
			reject();
		});
	});
}