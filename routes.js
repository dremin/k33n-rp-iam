'use strict';
module.exports = (app) => {
	var application = require('./controllers/application');
	var form = require('./controllers/form');
	var admin = require('./controllers/admin');
	var link = require('./controllers/link');
	var member = require('./controllers/member');

	/* Applications */
	app.route('/application/new')
		.post(application.create);

	app.route('/application/:appId')
		.get(application.get);

	app.route('/application/:appId/upvote')
		.get(application.upvote);

	app.route('/application/:appId/downvote')
		.post(application.downvote);

	app.route('/application/:appId/update')
		.post(application.update);
	
	app.route('/applications')
		.get(application.getList);

	app.route('/applications/load')
		.post(application.authAndGetApps);
	
	
	
	/* Forms */
	app.route('/form/:formName')
		.get(form.get);
	
	app.route('/form/:formName/description')
		.get(form.getDescription);



	/* Admin */
	app.route('/admin/startup')
		.get(admin.startup);

	app.route('/admin/ban')
		.post(admin.postBan)
		.delete(admin.deleteBan);



	/* Link */
	app.route('/link/identifier')
		.post(link.identifier);



	/* Member */
	app.route('/member/account')
		.get(member.account);

	app.route('/member/identifier')
		.get(member.identifier);
};