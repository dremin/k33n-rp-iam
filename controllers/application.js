'use strict';
const config = require('../common/config').config;
const db = require('../common/db');
const auth = require('../common/auth');
const request = require('../common/jsonRequest');
const validation = require('../validators/validation');
const action = require('../actions/action');
const fs = require('fs');
const numVotes = config.numVotes;
const donorRole = config.ips.donorRoles;
const dmSender = config.ips.dmSender;
const discordWebhook = config.discord.webhookUrl;

exports.get = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
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
		});
	});
};

exports.getList = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			db.query('select applications.id, userName, forms.label as form, isDonor, submitted, status from applications join forms on applications.form = forms.id order by isDonor desc, applications.id asc').then((apps) => {
				apps.forEach((app) => {
					app.submitted = app.submitted.toLocaleString('en-US');
				});
				
				res.json(apps);
			},
			(reason) => {
				res.status(400).json(reason);
			});
		});
	});
};

exports.create = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		// TODO this doesn't check for required dynamic form values
		var body = req.body;
		var colStr = 'userId, userName, form, charName, data, submitted';
		
		if (!(body.hasOwnProperty('name') && body.hasOwnProperty('formId') && body.hasOwnProperty('formData'))) {
			res.status(400).json({ message: 'Missing required fields' });
			return;
		}
		
		// check if another application was submitted or denied recently
		db.query('select id from applications where userId = ' + db.escape(data.id) + ' and form = ' + db.escape(body.formId) + ' and ((status = 3 and submitted >= NOW() - INTERVAL 2 WEEK) or (status = 1 or status = 2))').then((result) => {
			if (result.length > 0) {
				// already submitted or at least one denied application for this form within the past few weeks
				res.status(429).json({ message: 'User has an open or accepted application, or a denied application within the past 2 weeks.' });
				return;
			} else {
				// go on
				
				// dynamic db insert string
				var valueStr = db.escape(data.id) + ', ' + db.escape(data.name) + ', ' + db.escape(body.formId) + ', ' + db.escape(body.name) + ', ' + db.escape(JSON.stringify(body.formData)) + ', \'' + db.getDbDateTime() + '\'';
				
				// check if form requires special fields
				db.query('select name, label, requireDiscord, requireSteam from forms where id = ' + db.escape(body.formId)).then((result) => {
					if (result.length > 0) {
						
						if (!!result[0].requireDiscord) {
							// form requires discord, make sure we received and save to db
							if (!body.hasOwnProperty('discordName')) {
								res.status(400).json({ message: 'Missing required fields' });
								return;
							}
							
							colStr += ', discordName';
							valueStr += ', ' + db.escape(body.discordName);
						}
						
						if (!!result[0].requireSteam) {
							// form requires steam, make sure we received and save to db
							if (!body.hasOwnProperty('steamHex')) {
								res.status(400).json({ message: 'Missing required fields' });
								return;
							}
							
							colStr += ', steamHex';
							valueStr += ', ' + db.escape(body.steamHex);
						}
						
						// if user is a donor, mark the field
						auth.checkGroups(req, res, data.id, donorRole, false).then(() => {
							// is donor
							colStr += ', isDonor';
							valueStr += ', 1';
							
							db.query('insert into applications (' + colStr + ') values (' + valueStr + ')').then((result2) => {
								// Send PM to user
								var pm = fs.readFileSync("emails/" + result[0].name + "-submitted.htm", "utf8");
								
								auth.sendPm(dmSender, data.id, result[0].label + " Submission", pm).then(() => {
									// PM sent!
									// send discord notification to admins
									request.post(discordWebhook, { username: data.id, content: 'New ' + result[0].label + ' submission received' }, {}).then((data) => {
										// done!
										res.json({ message: 'All set!' });
									},
									(reason) => {
										// discord api error, continue anyway
										res.json({ message: 'All set!' });
									});
								},
								(reason) => {
									res.status(400).json(reason);
								});
							},
							(reason) => {
								res.status(400).json(reason);
							});
						},
						() => {
							// is not donor
							db.query('insert into applications (' + colStr + ') values (' + valueStr + ')').then((result2) => {
								// Send PM to user
								var pm = fs.readFileSync("emails/" + result[0].name + "-submitted.htm", "utf8");
								
								auth.sendPm(dmSender, data.id, result[0].label + " Submission", pm).then(() => {
									// PM sent!
									// send discord notification to admins
									request.post(discordWebhook, { username: data.name, content: 'New ' + result[0].label + ' submission received' }, {}).then((data) => {
										// done!
										res.json({ message: 'All set!' });
									},
									(reason) => {
										// discord api error, continue anyway
										res.json({ message: 'All set!' });
									});
								},
								(reason) => {
									res.status(400).json(reason);
								});
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
	});
};

exports.update = (req, res) => {
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			// TODO this doesn't check for required dynamic form values
			var body = req.body;
			
			if (!(body.hasOwnProperty('name') && body.hasOwnProperty('formId') && body.hasOwnProperty('formData'))) {
				res.status(400).json({ message: 'Missing required fields' });
				return;
			}
			
			// dynamic db insert string
			var updStr = 'charName = ' + db.escape(body.name) + ', data = ' + db.escape(JSON.stringify(body.formData));
			
			// check if form requires special fields
			db.query('select f.name, f.label, f.requireDiscord, f.requireSteam, a.status from applications a join forms f on a.form = f.id where a.id = ' + db.escape(req.params.appId)).then((result) => {
				if (result.length > 0) {
					
					if (!!result[0].requireDiscord) {
						// form requires discord, make sure we received and save to db
						if (!body.hasOwnProperty('discordName')) {
							res.status(400).json({ message: 'Missing required fields' });
							return;
						}
						
						updStr += ', discordName = ' + db.escape(body.discordName);
					}
					
					if (!!result[0].requireSteam) {
						// form requires steam, make sure we received and save to db
						if (!body.hasOwnProperty('steamHex')) {
							res.status(400).json({ message: 'Missing required fields' });
							return;
						}
						
						updStr += ', steamHex = ' + db.escape(body.steamHex);
					}
					
					db.query('update applications set ' + updStr + ' where id = ' + db.escape(req.params.appId)).then((result2) => {
						// Updated
						if (result[0].status == 1) {
							// if in pending status, trigger another check
							checkPending(req.params.appId, data.id, true).then((result) => {
								res.json(result);
							},
							(reason) => {
								if (reason.validations) {
									res.json(reason.validations);
								} else {
									res.status(400).json(reason);
								}
							});
						} else {
							res.json({ message: 'All set!' });
						}
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
		});
	});
};

exports.upvote = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
			db.query('insert into votes (appId, userId, upvote) values (' + db.escape(req.params.appId) + ', ' + db.escape(data.id) + ', 1)').then((result) => {
				db.query('select coalesce(sum(upvote)) as votes from votes where appId = ' + db.escape(req.params.appId) + ' group by appId').then((result2) => {
					if (result2.length > 0 && result2[0].votes >= numVotes) {
						// Approved!
						// Mark the application state to 1, in order to indicate action pending approval status
						db.query('update applications set status = 1, lastStatusChange = ' + db.escape(db.getDbDateTime()) + ' where id = ' + db.escape(req.params.appId)).then((result3) => {
							db.query('select a.userId, a.form, f.name as formName, f.label as formLabel from applications as a join forms as f on a.form = f.id where a.id = ' + db.escape(req.params.appId)).then((result4) => {
								if (result4.length > 0) {
									checkPending(req.params.appId, data.id, true).then((result) => {
										res.json(result);
									},
									(reason) => {
										// user still needs to perform some actions
										if (reason.validations) {
											// Send PM to user
											var pm = fs.readFileSync("emails/" + result4[0].formName + "-pending.htm", "utf8");
											
											auth.sendPm(dmSender, reason.userId, reason.formLabel + " Status Update", pm).then(() => {
												res.json({ message: 'All set!' });
											},
											(reason2) => {
												res.status(400).json(reason2);
											});
										} else {
											res.status(400).json(reason);
										}
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
		});
	});
};

exports.downvote = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.checkGroups(req, res, data.id, config.ips.adminGroups, true).then(() => {
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
		});
	});
};

exports.populateIAM = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		auth.getGroups(req, res, data.id).then((foundGroups) => {
			var matchFound = false;
			var response = {};

			// check each admin group if it is in the list of user groups
			config.ips.adminGroups.forEach((groupId) => {
				if (foundGroups.indexOf(groupId) >= 0) {
					matchFound = true;
				}
			});

			response.hasAdmin = matchFound;

			// get pending applications
			loadPending(data.id).then((apps) => {
				response.pendingApps = apps;

				// populate forms
				db.query('select id, name, label, neededGroup, ipsGroupToSet from forms order by id asc').then((forms) => {
				
					var userForms = [];
					
					forms.forEach((form) => {
						if ((form.neededGroup == null || foundGroups.includes(form.neededGroup)) && (form.ipsGroupToSet == null || !foundGroups.includes(form.ipsGroupToSet))) {
							userForms.push(form);
						}
					});
					
					response.forms = userForms;

					res.json(response);
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
}

exports.check = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		// attempt to validate the application
		checkPending(req.params.appId, data.id, false).then((result) => {
			res.json(result);
		},
		(reason) => {
			if (reason.validations) {
				res.json(reason.validations);
			} else {
				res.status(400).json(reason);
			}
		});
	});
}

exports.getPending = (req, res) => {
	// validate auth
	auth.ipsAuthCheck(req, res).then((data) => {
		// check for current user's applications that are in a pending state
		loadPending(data.id).then((apps) => {
			res.json(apps);
		},
		(reason) => {
			res.status(400).json(reason);
		});
	});
}

function loadPending(userId) {
	return new Promise((resolve, reject) => {
		db.query('select applications.id, forms.label as form, submitted from applications join forms on applications.form = forms.id where applications.userId = ' + db.escape(userId) + ' and applications.status = 1 order by applications.id, status desc').then((apps) => {
			apps.forEach((app) => {
				app.submitted = app.submitted.toLocaleString('en-US');
			});
			
			resolve(apps);
		},
		(reason) => {
			reject(reason);
		});
	});
}

function checkPending(appId, userId, isOnBehalf) {
	return new Promise((resolve, reject) => {
		// are all items valid? if so, perform approval actions
		validation.checkValidators(appId).then((validationResult) => {
			if (validationResult.userId == userId || isOnBehalf) {
				db.query('update applications set status = 2, lastStatusChange = ' + db.escape(db.getDbDateTime()) + ' where id = ' + db.escape(appId)).then((result) => {
					if (result.affectedRows > 0) {
						// run approval actions
						action.runActions(appId).then((actionResult) => {
							// Send PM to user
							var pm = fs.readFileSync("emails/" + validationResult.formName + "-accepted.htm", "utf8");
							
							auth.sendPm(dmSender, validationResult.userId, validationResult.formLabel + " Status Update", pm).then(() => {
								// all done!
								
								resolve(validationResult.validations.concat(actionResult.validations));
							},
							(reason) => {
								reject(reason);
							});
						},
						(reason) => {
							if (reason.validations) {
								resolve(validationResult.validations.concat(reason.validations));
							} else {
								reject(reason);
							}
						});
					} else {
						reject("No application updated");
					}
				},
				(reason) => {
					reject(reason);
				});
			} else {
				reject("Not your application");
			}
		},
		(reason) => {
			if (reason.validations) {
				resolve(reason.validations);
			} else {
				reject(reason);
			}
		});
	});
}