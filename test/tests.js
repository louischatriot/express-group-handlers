var should = require('chai').should()
  , assert = require('chai').assert
	, http = require('http')
	, async = require('async')
	, express = require('express')
	, request = require('request')
	, _ = require('underscore')
	, groupHandlers = require('../index')
	, beforeEach = groupHandlers.beforeEach
	, afterEach = groupHandlers.afterEach
	, testPort = 3000   // Change this if you already have something running on this port and absolutely want to test this module
  ;

// Launch an Express server in a way that lets us close it cleanly
function launchServer (port, cb) {
  var callback = cb ? cb : function () {}
    , self = this;

	self.apiServer = http.createServer(self);   // Let's not call it 'server' we never know if express will want to use this variable!

	self.apiServer.on('error', function (err) {
		console.log("Couldn't launch the Express server, another server is probably running on the same port");
		process.exit(1);
	});

	// Begin to listen. If the callback gets called, it means the server was successfully launched
	self.apiServer.listen.apply(self.apiServer, [port, function() {
		callback();
	}]);
}

// Cleanly stop the Express server
function stopServer (cb) {
  var callback = cb ? cb : function () {};

  this.apiServer.close(function () {
    callback();
  });
}


// Will send { applied: false } unless middleware toApply has been called before
function normalHandler (req, res, next) {
	var applied = req.applied || {};
	applied.normalHandler = true;
	return res.json(200, applied);
}

// Returns a middleware that adds property to the req.applied object
function apply(prop) {
	return function (req, res, next) {
		req.applied = req.applied || {};
		req.applied[prop] = true;
		return next();
	}
}

// Test a route to see if toApply has been applied or not
function testRoute (route, targetApplied, cb) {
	request.get({ uri: 'http://localhost:' + testPort + route }, function (err, res, body) {
		var obj = JSON.parse(body);
		_.isEqual(obj, targetApplied).should.equal(true);
		cb();
	});
}


/**
 * Begin tests
 */
describe('beforeEach', function () {

	it('Applies a middleware to a group of routes', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		beforeEach(app, apply('onetest'), function (app) {
			app.get('/route2', normalHandler);
			app.get('/route3', normalHandler);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, onetest: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Also works if you mix up handlers and arrays of handlers in the route definition, as in Express', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		beforeEach(app, apply('onetest'), function (app) {
			app.get('/route2', apply('one'), [apply('two'), apply('three')], normalHandler);
			app.get('/route3', [apply('inarray'), normalHandler]);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true, one: true, two: true, three: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, onetest: true, inarray: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can apply multiple middlewares or arrays of middlewares before the normal route handlers', function (done) {
		var app = express();

		beforeEach(app, apply('onetest'), apply('twotest'), apply('threetest'), function (app) {
			app.get('/route1', normalHandler);
			app.get('/route2', normalHandler);
		});

		// Works with arrays too
		beforeEach(app, [apply('onetest'), apply('twotest')], apply('threetest'), function (app) {
			app.get('/route3', normalHandler);
			app.get('/route4', normalHandler);
		});

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true, onetest: true, twotest: true, threetest: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true, twotest: true, threetest: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, onetest: true, twotest: true, threetest: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true, onetest: true, twotest: true, threetest: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can nest multiple beforeEach', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		beforeEach(app, apply('onetest'), function (app) {
			app.get('/route2', normalHandler);

			beforeEach(app, apply('anothertest'), function (app) {
				app.get('/route3', normalHandler);
				app.get('/route4', normalHandler);
			});
		});


		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, onetest: true, anothertest: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true, onetest: true, anothertest: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can be called as methods of the Express app after setup', function (done) {
		var app = express();

		groupHandlers.setup(app);

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		app.beforeEach(apply('onetest'), function (app) {
			app.get('/route2', normalHandler);

			app.beforeEach(apply('anothertest'), function (app) {
				app.get('/route3', normalHandler);
				app.get('/route4', normalHandler);
			});
		});


		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true })
		//, async.apply(testRoute, '/route3', { normalHandler: true, onetest: true, anothertest: true })
		//, async.apply(testRoute, '/route4', { normalHandler: true, onetest: true, anothertest: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Works with the all convenience method', function (done) {
		var app = express();

		app.all('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		beforeEach(app, apply('onetest'), function (app) {
			app.all('/route2', normalHandler);
			app.all('/route3', normalHandler);
		});

		app.all('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, onetest: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, onetest: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

});


describe('afterEach', function () {

	it('Applies a middleware after a group of routes', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		afterEach(app, normalHandler, function (app) {
			app.get('/route2', apply('thatsbefore'));
			app.get('/route3', apply('thattoo'));
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
		, async.apply(testRoute, '/route2', { normalHandler: true, thatsbefore: true })
		, async.apply(testRoute, '/route3', { normalHandler: true, thattoo: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

});

