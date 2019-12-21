'use strict';
const config = require('../common/config').config;
const db = require('../common/db');
const auth = require('../common/auth');

exports.addAccess = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			var body = req.body;
			
			if (body.hasOwnProperty('steamid')) {
				db.query('insert into whitelist (steamid) values (' + db.escape(body.steamid) + ')').then((result) => {
					res.json({ message: 'All set!' });
					console.log('User ' + data.name + ' whitelisted hex ' + body.steamId);
				},
				(reason) => {
					res.status(400).json(reason);
				});
			} else {
				res.status(400).json("No Steam ID provided");
			}
		});
	});
};

exports.checkAccess = (req, res) => {
	db.query('select steamid, priority from whitelist where steamid = ' + db.escape(req.params.steamId) + ' and warns < 3 and banned = 0').then((result) => {
		if (result.length > 0) {
			res.json(result[0]);
		} else {
			res.status(400).json({ message: 'Player not able to join' });
		}
	},
	(reason) => {
		res.status(400).json(reason);
	});
};

exports.checkAccessAdmin = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			db.query('select steamid, priority, warns, banned from whitelist where steamid = ' + db.escape(req.params.steamId)).then((result) => {
				if (result.length > 0) {
					var charId = "%" + req.params.steamId.replace("steam:", "");
					db.query("select group_concat(firstname, ' ', lastname SEPARATOR ', ') as charName, name from essentialmode.users where identifier like " + db.escape(charId) + " and firstname <> '' group by name").then((result2) => {
						if (result2.length > 0) {
							result[0].charNames = result2[0].charName;
							result[0].steamName = result2[0].name;
						}

						db.query("select date, type, reason from accountability where steamid = " + db.escape(req.params.steamId)).then((result3) => {
							if (result3.length > 0) {
								var logs = [];

								result3.forEach(log => {
									logs.push({
										date: log.date.toLocaleString('en-US'),
										type: log.type,
										reason: log.reason
									});
								});

								result[0].logs = logs;
							}
							
							res.json(result[0]);
						},
						(reason) => {
							res.status(400).json(reason);
						});
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
	});
};

exports.priority = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			var body = req.body;
			
			if (body.hasOwnProperty('priority')) {
				db.query('update whitelist set priority = ' + db.escape(body.priority) + ' where steamid = ' + db.escape(req.params.steamId)).then((result) => {
					res.json({ message: 'All set!' });
					console.log('User ' + data.name + ' gave hex ' + req.params.steamId + ' priority ' + body.priority);
				},
				(reason) => {
					res.status(400).json(reason);
				});
			} else {
				res.status(400).json("No priority provided");
			}
		});
	});
};

exports.ban = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			var body = req.body;
			var banned = 1;
			var logType = 1;
			
			if (body.hasOwnProperty('clear') && body.clear) {
				banned = 0;
				logType = 3;
			}
			
			db.query('update whitelist set banned = ' + db.escape(banned) + ' where steamid = ' + db.escape(req.params.steamId)).then((result) => {
				console.log('User ' + data.name + ' gave hex ' + req.params.steamId + ' ban value ' + banned);

				var reason = "None provided";
				if (req.body && req.body.reason) {
					reason = req.body.reason;
				}

				db.query('insert into accountability (steamid, date, type, reason) values (' + db.escape(req.params.steamId) + ', ' + db.escape(db.getDbDateTime()) + ', ' + logType + ', ' + db.escape(reason) + ')').then((result1) => {
					res.json({ message: 'All set!' });
					
					// TODO: Post to Discord?
				},
				(reason) => {
					res.status(400).json(reason);
				});
			},
			(reason) => {
				res.status(400).json(reason);
			});
		});
	});
};

exports.warn = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			var body = req.body;
			var reduce = false;
			var logType = 0;
			
			if (body.hasOwnProperty('reduce') && body.reduce) {
				reduce = true;
				logType = 2;
			}
			
			db.query('select warns from whitelist where steamid = ' + db.escape(req.params.steamId)).then((result) => {
				if (result.length > 0 && result[0].warns != null) {
					var warns = result[0].warns;
					
					if (reduce) {
						warns = warns - 1;
					} else {
						warns = warns + 1;
					}
					
					db.query('update whitelist set warns = ' + db.escape(warns) + ' where steamid = ' + db.escape(req.params.steamId)).then((result1) => {
						console.log('User ' + data.name + ' gave hex ' + req.params.steamId + ' warn level ' + warns);

						var reason = "None provided";
						if (req.body && req.body.reason) {
							reason = req.body.reason;
						}

						db.query('insert into accountability (steamid, date, type, reason) values (' + db.escape(req.params.steamId) + ', ' + db.escape(db.getDbDateTime()) + ', ' + logType + ', ' + db.escape(reason) + ')').then((result2) => {
							res.json({ message: 'All set!' });
							
							// TODO: Post to Discord?
						},
						(reason) => {
							res.status(400).json(reason);
						});
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
	});
};