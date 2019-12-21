'use strict';
module.exports = (app) => {
	var application = require('./controllers/application');
	var form = require('./controllers/form');
	var launcher = require('./controllers/launcher');
	var user = require('./controllers/user');

	/* Applications */
	app.route('/application/new')
		.post(application.create);

	app.route('/application/:appId')
		.get(application.get);

	app.route('/application/:appId/upvote')
		.get(application.upvote);

	app.route('/application/:appId/downvote')
		.post(application.downvote);

	app.route('/application/:appId/check')
		.get(application.check);

	app.route('/application/:appId/update')
		.post(application.update);
	
	app.route('/applications')
		.get(application.getList);
	
	app.route('/applications/pending')
		.get(application.getPending);

	app.route('/applications/load')
		.get(application.populateIAM);
	
	
	
	/* Forms */
	app.route('/form/:formName')
		.get(form.get);
	
	app.route('/form/:formName/description')
		.get(form.getDescription);
	
	
	
	/* Whitelist */
	app.route('/access')
		.post(user.addAccess);
	
	app.route('/access/:steamId/ban')
		.post(user.ban);
	
	app.route('/access/:steamId/priority')
		.post(user.priority);
	
	app.route('/access/:steamId/warn')
		.post(user.warn);
	
	app.route('/access/:steamId/check')
		.get(user.checkAccessAdmin);
	
	app.route('/check-access/:steamId')
		.get(user.checkAccess);
		
		
	/* Launcher */
	app.route('/launcher')
		.get(launcher.getUserInfo);
};