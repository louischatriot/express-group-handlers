var supportedHttpMethods = require('methods')   // Same module Express uses
  , beforeEach, afterEach
  ;


/**
 * Flatten the given `arr`
 * Taken from Express
 * @api private
 */
function flatten (arr, ret){
  var len = arr.length
    , i;
  ret = ret || [];
  for (i = 0; i < len; ++i) {
    if (Array.isArray(arr[i])) {
      flatten(arr[i], ret);
    } else {
      ret.push(arr[i]);
    }
  }
  return ret;
}


/**
 * Returns a METHOD (GET, POST ...) handler that applies 'handlers' before its own handlers are called
 * @api private
 */
function applyExtraHandlersBefore (expressApp, method, handlers) {
  return function (path) {
    expressApp[method].call(expressApp, path, handlers, [].slice.call(arguments, 1));
  };
}

/**
 * Returns a METHOD (GET, POST ...) handler that applies 'handlers' after its own handlers are called
 * @api private
 */
function applyExtraHandlersAfter (expressApp, method, handlers) {
  return function (path) {
    expressApp[method].call(expressApp, path, [].slice.call(arguments, 1), handlers);
  };
}

/**
 * Creates beforeEach and afterEach depending on the given modifier
 * (all-purpose, could of course use other modifiers, make your imagination go wild!)
 * @api private
 */
function useFakeExpressAll (modifier) {
  return function () {
    var expressApp = arguments[0]
      , callback = arguments[arguments.length - 1]
      , handlers = flatten([].slice.call(arguments, 1, arguments.length - 1)) || []
      , fakeExpressApp = {}
      , methodsToFake = supportedHttpMethods
      ;

    if (!expressApp) { return; }

    methodsToFake.push('all');
    methodsToFake.forEach(function (method) {
      fakeExpressApp[method] = modifier(expressApp, method, handlers);
    });

    // Will not be set if setup hasn't be called
    fakeExpressApp.beforeEach = expressApp.beforeEach;
    fakeExpressApp.afterEach = expressApp.afterEach;

    callback(fakeExpressApp);
  }
}


/**
 * Call middleware before every every route handler in this groupe. Use like this:
 * beforeEach(expressApp, middleware[, middleware2, ...], function(app) {
 *   app.get('/route1', handler1);
 *   app.post('/route2', handler2);
 * });
 */
beforeEach = useFakeExpressAll(applyExtraHandlersBefore);
module.exports.beforeEach = beforeEach;

/**
 * Same as above but the middlewares are called after the route handlers
 */
afterEach = useFakeExpressAll(applyExtraHandlersAfter);
module.exports.afterEach = afterEach;


/**
 * Set up groupings so that they can be called as a method of the express app
 */
module.exports.setup = function (expressApp) {
  expressApp.beforeEach = function () {
    var newArgs = [this], i;
    for (i = 0; i < arguments.length; i += 1) { newArgs.push(arguments[i]); }
    beforeEach.apply(null, newArgs);
  };

  expressApp.afterEach = function () {
    var newArgs = [this], i;
    for (i = 0; i < arguments.length; i += 1) { newArgs.push(arguments[i]); }
    afterEach.apply(null, newArgs);
  };
}



