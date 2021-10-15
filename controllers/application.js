'use strict';
const config = require('../common/config').config;
const db = require('../common/db');
const auth = require('../common/auth');
const request = require('../common/jsonRequest');
const discord = require('../common/discord');
const fs = require('fs');
const numVotes = config.numVotes;
const discordWebhook = config.discord.webhookUrl;

exports.get = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		auth.checkRoles(data.roles, config.discord.adminRoles).then(() => {
			db.query('select a.*, coalesce(sum(v.upvote)) as votes from applications a left join votes v on a.id = v.appId where a.id = ' + db.escape(req.params.appId)).then((result) => {
				if (result.length > 0) {
					res.json(result[0]);
				} else {
					res.status(400).json({ message: 'Invalid application ID' })
				}
			},
			(reason) => {
				res.status(400).json(reason);
			});
		})
		.catch((reason) => {
			res.status(403).json(reason)
		})
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.getList = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		auth.checkRoles(data.roles, config.discord.adminRoles).then(() => {
			db.query('select applications.id, userName, forms.label as form, isDonor, submitted, status from applications join forms on applications.form = forms.id order by isDonor desc, applications.id asc').then((apps) => {
				apps.forEach((app) => {
					app.submitted = app.submitted.toLocaleString('en-US');
				});
				
				res.json(apps);
			},
			(reason) => {
				res.status(400).json(reason);
			});
		})
		.catch((reason) => {
			res.status(403).json(reason)
		})
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.create = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		// TODO this doesn't check for required dynamic form values
		var body = req.body;
		var colStr = 'userId, userName, form, charName, data, submitted';
		
		if (!(body.hasOwnProperty('name') && body.hasOwnProperty('formId') && body.hasOwnProperty('formData'))) {
			res.status(400).json({ message: 'Missing required fields' });
			return;
		}
		
		// check if another application was submitted or denied recently
		db.query('select id from applications where userId = ' + db.escape(data.id) + ' and form = ' + db.escape(body.formId) + ' and ((status = 3 and submitted >= NOW() - INTERVAL 2 WEEK) or (status = 0 or status = 1 or status = 2))').then((result) => {
			if (result.length > 0) {
				// already submitted or at least one denied application for this form within the past few weeks
				res.status(429).json({ message: 'User has an open or accepted application, or a denied application within the past 2 weeks.' });
				return;
			} else {
				// go on
				
				// dynamic db insert string
				var valueStr = db.escape(data.id) + ', ' + db.escape(data.name) + ', ' + db.escape(body.formId) + ', ' + db.escape(body.name) + ', ' + db.escape(JSON.stringify(body.formData)) + ', \'' + db.getDbDateTime() + '\'';
				
				// check if form is valid
				db.query('select name, label from forms where id = ' + db.escape(body.formId)).then((result) => {
					if (result.length > 0) {
						// if user is a donor, mark the field
						auth.checkRoles(data.roles, config.discord.donorRoles).then(() => {
							// is donor
							colStr += ', isDonor';
							valueStr += ', 1';
							
							db.query('insert into applications (' + colStr + ') values (' + valueStr + ')').then((result2) => {
								sendSubmissionPm(data, result[0]).then(() => {
									res.json({ message: 'All set!' });
								})
								.catch((reason) => {
									res.status(400).json(reason);
								})
							},
							(reason) => {
								res.status(400).json(reason);
							});
						},
						() => {
							// is not donor
							db.query('insert into applications (' + colStr + ') values (' + valueStr + ')').then((result2) => {
								sendSubmissionPm(data, result[0]).then(() => {
									res.json({ message: 'All set!' });
								})
								.catch((reason) => {
									res.status(400).json(reason);
								})
							},
							(reason) => {
								res.status(400).json(reason);
							});
						});
					} else {
						res.status(400).json({ message: 'Invalid form ID' });
						return;
					}
				},
				(reason) => {
					res.status(400).json(reason);
					return;
				});
			}
		},
		(reason) => {
			res.status(400).json(reason);
			return;
		});
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.update = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		auth.checkRoles(data.roles, config.discord.adminRoles).then(() => {
			// TODO this doesn't check for required dynamic form values
			var body = req.body;
			
			if (!(body.hasOwnProperty('name') && body.hasOwnProperty('formId') && body.hasOwnProperty('formData'))) {
				res.status(400).json({ message: 'Missing required fields' });
				return;
			}
			
			db.query('select f.name, f.label, a.status from applications a join forms f on a.form = f.id where a.id = ' + db.escape(req.params.appId)).then((result) => {
				if (result.length > 0) {
					db.query('update applications set charName = ' + db.escape(body.name) + ', data = ' + db.escape(JSON.stringify(body.formData)) + ' where id = ' + db.escape(req.params.appId)).then((result2) => {
						// Updated
						res.json({ message: 'All set!' });
					},
					(reason) => {
						res.status(400).json(reason);
					});
				} else {
					res.status(400).json({ message: 'Invalid form ID' });
					return;
				}
			},
			(reason) => {
				res.status(400).json(reason);
				return;
			});
		})
		.catch((reason) => {
			res.status(403).json(reason)
		})
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.upvote = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		auth.checkRoles(data.roles, config.discord.adminRoles).then(() => {
			db.query('insert into votes (appId, userId, upvote) values (' + db.escape(req.params.appId) + ', ' + db.escape(data.id) + ', 1)').then((result) => {
				db.query('select coalesce(sum(upvote)) as votes from votes where appId = ' + db.escape(req.params.appId) + ' group by appId').then((result2) => {
					if (result2.length > 0 && result2[0].votes >= numVotes) {
						// Approved!
						// Mark the application state to 2, in order to indicate approval status
						db.query('update applications set status = 2, lastStatusChange = ' + db.escape(db.getDbDateTime()) + ' where id = ' + db.escape(req.params.appId)).then((result3) => {
							db.query('select a.userId, a.form, f.name as formName, f.label as formLabel, f.sendPairingCode, f.discordRoleToSet from applications as a join forms as f on a.form = f.id where a.id = ' + db.escape(req.params.appId)).then((result4) => {
								if (result4.length > 0) {
									// run approval actions
									performApprovalActions(result4[0]).then(() => {
										res.json(result);
									})
									.catch((reason) => {
										res.status(400).json(reason);
									})
								} else {
									res.status(400).json({ message: 'Application not found' });
								}
							},
							(reason) => {
								res.status(400).json(reason);
							});
						},
						(reason) => {
							res.status(400).json(reason);
						});
					} else {
						res.json({ message: 'All set!' });
					}
				},
				(reason) => {
					res.status(400).json(reason);
				});
			},
			(reason) => {
				res.status(400).json(reason);
			});
		})
		.catch((reason) => {
			res.status(403).json(reason)
		})
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.downvote = (req, res) => {
	auth.validateToken(req.get('Authorization')).then((data) => {
		auth.checkRoles(data.roles, config.discord.adminRoles).then(() => {
			db.query('insert into votes (appId, userId, upvote) values (' + db.escape(req.params.appId) + ', ' + db.escape(data.id) + ', -1)').then((result) => {
				db.query('select coalesce(sum(upvote)) as votes from votes where appId = ' + db.escape(req.params.appId) + ' group by appId').then((result2) => {
					if (result2.length > 0 && result2[0].votes <= (numVotes * -1)) {
						// Denied!
						// Mark the application state to 3, in order to indicate declined
						var body = req.body;
			
						if (!body.hasOwnProperty('deniedReason')) {
							res.status(400).json({ message: 'Missing required fields' });
							return;
						}
						
						db.query('update applications set status = 3, lastStatusChange = ' + db.escape(db.getDbDateTime()) + ', deniedReason = ' + db.escape(req.body.deniedReason) + ' where id = ' + db.escape(req.params.appId)).then((result3) => {
							db.query('select a.userId, a.form, f.name as formName, f.label as formLabel from applications as a join forms as f on a.form = f.id where a.id = ' + db.escape(req.params.appId)).then((result4) => {
								if (result4.length > 0) {
									// Send PM to user
									var pmPre = fs.readFileSync("emails/" + result4[0].formName + "-denied.htm", "utf8");
									var pm = pmPre.replace("{replace}", req.body.deniedReason);
									
									auth.sendPm(dmSender, result4[0].userId, result4[0].formLabel + " Status Update", pm).then(() => {
										// all done!
										
										res.json({ message: 'All set!' });
									},
									(reason) => {
										res.status(400).json(reason);
									});
								} else {
									res.status(400).json();
								}
							},
							(reason) => {
								res.status(400).json(reason);
							});
						},
						(reason) => {
							res.status(400).json(reason);
						});
					} else {
						res.json({ message: 'All set!' });
					}
				},
				(reason) => {
					res.status(400).json(reason);
				});
			},
			(reason) => {
				res.status(400).json(reason);
			});
		})
		.catch((reason) => {
			res.status(403).json(reason)
		})
	})
	.catch((reason) => {
		res.status(401).json(reason)
	})
};

exports.authAndGetApps = (req, res) => {
	// perform auth
	auth.discordAuth(req.body.code).then((data) => {
		var matchFound = false;
		var response = {};

		response.token = data.token;

		// check each admin group if it is in the list of user groups
		config.discord.adminRoles.forEach((roleId) => {
			if (data.roles.indexOf(roleId) >= 0) {
				matchFound = true;
			}
		});

		response.hasAdmin = matchFound;

		// populate forms
		db.query('select id, name, label, neededRole, discordRoleToSet from forms order by id asc').then((forms) => {
			
			var userForms = [];
			
			forms.forEach((form) => {
				if ((form.neededRole == null || data.roles.includes(form.neededRole)) && (form.discordRoleToSet == null || !data.roles.includes(form.discordRoleToSet))) {
					userForms.push(form);
				}
			});
			
			response.forms = userForms;

			res.json(response);
		},
		(reason) => {
			res.status(400).json(reason);
		});
	})
	.catch((error) => {
		res.status(400).json(error);
	})
}

function performApprovalActions(formData) {
	return new Promise((resolve, reject) => {
		// run approval actions
		// give discord role
		discord.giveRole(formData.userId, formData.discordRoleToSet)
		.then(() => {
			// send acceptance DM
			var pm = fs.readFileSync("emails/" + formData.formName + "-accepted.htm", "utf8");
			discord.sendPm(formData.userId, formData.formLabel + " Status Update", pm).then(() => {
				// send pairing code if necessary
				if (formData.sendPairingCode == 1) {
					getPairingCode(formData.userId)
					.then((pairingCode) => {
						discord.sendPm(formData.userId, "FiveM Pairing Code", "The first time you join the server, you will need to enter this code: **" + pairingCode + "**").then(() => {
							resolve()
						},
						(reason) => {
							reject(reason);
						});
					})
					.catch((reason) => {
						reject(reason)
					})
				} else {
					resolve();
				}
			},
			(reason) => {
				reject(reason);
			});
		},
		(reason) => {
			reject(reason);
		});
	})
}

function getPairingCode(userId) {
	return new Promise((resolve, reject) => {
		db.query('select * from pairing where userId = ' + db.escape(userId)).then((pairingData) => {
			if (pairingData.length > 0) {
				// pairing token already generated
				resolve(pairingData[0].pairingToken)
			} else {
				let pairingCode = discord.uuidv4()
				db.query('insert into pairing (userId, pairingToken) values (' + db.escape(userId) + ',' + db.escape(pairingCode) + ')').then((newPairingData) => {
					resolve(pairingCode)
				},
				(reason) => {
					reject(reason)
				})
			}
		},
		(reason) => {
			reject(reason)
		})
	})
}

function sendSubmissionPm(user, formData) {
	return new Promise((resolve, reject) => {
		// Send PM to user
		var pm = fs.readFileSync("emails/" + formData.name + "-submitted.htm", "utf8");
									
		discord.sendPm(user.id, formData.label + " Submission", pm).then(() => {
			// PM sent!
			// send discord notification to admins
			request.post(discordWebhook, { username: user.name, content: 'New ' + formData.label + ' submission received' }, {}).then((data) => {
				// done!
				resolve()
			},
			(reason) => {
				// discord api error, continue anyway
				resolve()
			});
		},
		(reason) => {
			reject(reason);
		});
	})
}