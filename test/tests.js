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

// Finish a request
function normalHandler (req, res, next) {
	var applied = req.applied || true;
	applied = { normalHandler: applied };
	return res.json(200, applied);
}

// Return a middleware that transforms the current req.applied into
// { prop: applied } where prop can be any string
// This way we can test the handlers execute in the right order,
// the rightmost variables correspond to the handlers applied first
function apply(prop) {
	return function (req, res, next) {
		var _applied = req.applied || true;
		req.applied = {};
		req.applied[prop] = _applied;
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

		beforeEach(app, apply('onetest'), function (app) {
			app.get('/route2', normalHandler);
			app.get('/route3', normalHandler);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
		, async.apply(testRoute, '/route2', { normalHandler: { onetest: true } })
		, async.apply(testRoute, '/route3', { normalHandler: { onetest: true } })
		, async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Also works if you mix up handlers and arrays of handlers in the route definition, as in Express', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		beforeEach(app, apply('onetest'), function (app) {
			app.get('/route2', apply('one'), [apply('two'), apply('three')], normalHandler);
			app.get('/route3', [apply('inarray'), normalHandler]);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
		, async.apply(testRoute, '/route2', { normalHandler: { three: { two: { one: { onetest: true } } } } })
		, async.apply(testRoute, '/route3', { normalHandler: { inarray: { onetest: true } } })
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
	  , async.apply(testRoute, '/route1', { normalHandler: { threetest: { twotest: { onetest: true } } } })
	  , async.apply(testRoute, '/route2', { normalHandler: { threetest: { twotest: { onetest: true } } } })
	  , async.apply(testRoute, '/route3', { normalHandler: { threetest: { twotest: { onetest: true } } } })
	  , async.apply(testRoute, '/route4', { normalHandler: { threetest: { twotest: { onetest: true } } } })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can nest multiple beforeEach', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

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
	  , async.apply(testRoute, '/route2', { normalHandler: { onetest: true } })
	  , async.apply(testRoute, '/route3', { normalHandler: { anothertest: { onetest: true } } })
	  , async.apply(testRoute, '/route4', { normalHandler: { anothertest: { onetest: true } } })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can be called as methods of the Express app after setup', function (done) {
		var app = express();

		groupHandlers.setup(app);

		app.get('/route1', normalHandler);

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
	  , async.apply(testRoute, '/route2', { normalHandler: { onetest: true } })
		, async.apply(testRoute, '/route3', { normalHandler: { anothertest: { onetest: true } } })
		, async.apply(testRoute, '/route4', { normalHandler: { anothertest: { onetest: true } } })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Works with the all convenience method', function (done) {
		var app = express();

		app.all('/route1', normalHandler);

		beforeEach(app, apply('onetest'), function (app) {
			app.all('/route2', normalHandler);
			app.all('/route3', normalHandler);
		});

		app.all('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: { onetest: true } })
	  , async.apply(testRoute, '/route3', { normalHandler: { onetest: true } })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

});


// The same function is used underneath beforeEach and afterEach so a simple test is enough to ensure correctness
describe('afterEach', function () {

	it('Applies a middleware after a group of routes', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		afterEach(app, normalHandler, function (app) {
			app.get('/route2', apply('thatsbefore'));

			// The more you nested afterEach are executed before, which mirrors the behaviour of beforeEach
			afterEach(app, apply('thistoo'), function (app) {
				app.get('/route3', apply('thattoo'));
			});
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
		, async.apply(testRoute, '/route2', { normalHandler: { thatsbefore: true } })
		, async.apply(testRoute, '/route3', { normalHandler: { thistoo: { thattoo: true } } })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

	it('Can nest afterEach and beforeEach', function (done) {
		var app = express();

		beforeEach(app, apply('beforeallthis'), function (app) {
			afterEach(app, normalHandler, function (app) {
				app.get('/route1', apply('thatsbefore'));
				app.get('/route2', apply('thattoo'));
			});
		});

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
		, async.apply(testRoute, '/route1', { normalHandler: { thatsbefore: { beforeallthis: true } } })
		, async.apply(testRoute, '/route2', { normalHandler: { thattoo: { beforeallthis: true } } })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});

});

