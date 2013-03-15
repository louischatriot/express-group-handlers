var should = require('chai').should()
  , assert = require('chai').assert
	, http = require('http')
	, async = require('async')
	, express = require('express')
	, request = require('request')
	, groupHandlers = require('../index')
	, beforeEach = groupHandlers.beforeEach
	, testPort = 3000   // Change this if you already have something running on this port and absolutely want to test this module
  ;

// Will send { applied: false } unless middleware toApply has been called before
function normalHandler (req, res, next) {
	return res.json(200, { applied: req.applied ? true: false });
}

function toApply (req, res, next) {
	req.applied = true;
	return next();
}

// Test a route to see if toApply has been applied or not
function testRoute (route, shouldBeApplied, cb) {
	request.get({ uri: 'http://localhost:' + testPort + route }, function (err, res, body) {
		var obj = JSON.parse(body);
		obj.applied.should.equal(shouldBeApplied);
		cb();
	});
}

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


describe('beforeEach', function () {

	it('Applies a middleware to a group of routes', function (done) {
		var app = express();

		app.get('/route1', normalHandler);

		beforeEach(app, toApply, function (app) {
			app.get('/route2', normalHandler);
			app.get('/route3', normalHandler);
		});

		app.get('/route4', normalHandler);

		async.waterfall([
			function (cb) { launchServer.call(app, testPort, cb); }
	  , async.apply(testRoute, '/route1', false)
	  , async.apply(testRoute, '/route2', true)
	  , async.apply(testRoute, '/route3', true)
	  , async.apply(testRoute, '/route4', false)
	  , function (cb) { stopServer.call(app, cb); }
		], done);
	});


});

