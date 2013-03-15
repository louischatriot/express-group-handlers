var should = require('chai').should()
  , assert = require('chai').assert
	, http = require('http')
	, async = require('async')
	, express = require('express')
	, request = require('request')
	, groupHandlers = require('../index')
	, beforeEach = groupHandlers.beforeEach
  ;

// Will send { applied: false } unless middleware toApply has been called before
function normalHandler (req, res, next) {
	return res.json(200, { applied: req.applied ? true: false });
}

function toApply (req, res, next) {
	req.applied = true;
	return next();
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

		app.get('/', function(req, res){
			res.send('hello world');
		});

		launchServer.call(app, 3000, function () {
			request.get({ uri: 'http://localhost:3000/' }, function (err, res, body) {
				console.log(body);

				stopServer.call(app, function () {

					console.log("launched");
					done();
				});
			});
		});
	});

	it('Applies a middleware to a group of routes', function (done) {
		var app = express();

		app.get('/', function(req, res){
			res.send('hello world');
		});

		launchServer.call(app, 3000, function () {
			request.get({ uri: 'http://localhost:3000/' }, function (err, res, body) {
				console.log(body);

				stopServer.call(app, function () {

					console.log("launched");
					done();
				});
			});
		});
	});

});

