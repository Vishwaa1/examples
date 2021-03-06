exports.install = function(framework) {
	framework.route('/', view_logged, ['authorize']);
	framework.route('/', view_homepage);
	framework.route('/', json_homepage, ['xhr', 'post']);
	framework.route('/logout/', logout, ['authorize', 'get']);
};

function view_logged() {
	var self = this;
	self.plain('You are logged as {0}. To unlogged remove cookie __user or click http://{1}:{2}/logout/'.format(self.user.email, framework.ip, framework.port));
}

function view_homepage() {
	var self = this;
	self.view('homepage', { LoginName: '@' });
}

function json_homepage() {

	var self = this;
	var errorBuilder = self.validate(self.post, ['LoginName', 'LoginPassword']);

	if (self.user !== null)
		errorBuilder.add('Logged');

	if (errorBuilder.hasError()) {
		self.json(errorBuilder);
		return;
	}

	var db = self.database('users');
	var filter = function(o) { return o.email === self.post.LoginName && o.password === self.post.LoginPassword; };

	db.one(filter, function(user) {

		if (user === null) {
			errorBuilder.add('LoginError');
			self.json(errorBuilder);
			return;
		}

		self.database('users-logs').insert({ id: user.id, email: user.email, ip: self.req.ip, date: new Date() });

		// save to cookie
		self.res.cookie(self.config.cookie, framework.encrypt({ id: user.id, ip: self.req.ip }, 'user'), new Date().add('m', 5));

		// return result
		self.json({ r: true });
	});
}

function logout() {
	var self = this;
	self.res.cookie(self.config.cookie, '', new Date().add('y', -1));
	self.redirect('/');
}