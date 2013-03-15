var should = require('chai').should()
  , assert = require('chai').assert
	, http = require('http')
	, async = require('async')
	, express = require('express')
	, request = require('request')
	, _ = require('underscore')
	, groupHandlers = require('../index')
	, beforeEach = groupHandlers.beforeEach
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

function toApply (req, res, next) {
	req.applied = req.applied || {};
	req.applied.caca = true;
	return next();
}

// Test a route to see if toApply has been applied or not
function testRoute (route, targetApplied, cb) {
	request.get({ uri: 'http://localhost:' + testPort + route }, function (err, res, body) {
		var obj = JSON.parse(body);
		_.isEqual(obj, targetApplied).should.equal(true);
		cb();
	});
}

describe('beforeEach', function () {

	it('Applies a middleware to a group of routes', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		// toApply will be applied both to /route2 and /route3, before normalHandler is called
		beforeEach(app, toApply, function (app) {
			app.get('/route2', normalHandler);
			app.get('/route3', normalHandler);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', { normalHandler: true })
	  , async.apply(testRoute, '/route2', { normalHandler: true, caca: true })
	  , async.apply(testRoute, '/route3', { normalHandler: true, caca: true })
	  , async.apply(testRoute, '/route4', { normalHandler: true })
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});


});

