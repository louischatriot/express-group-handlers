var supportedHttpMethods = require('methods');   // Same module Express uses


/**
 * Flatten the given `arr`
 * Taken from Express
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
 * Call middleware before every every route handler in this groupe. Use like this:
 * beforeEach(expressApp, middleware[, middleware2, ...], function(app) {
 *   app.get('/route1', handler1);
 *   app.post('/route2', handler2);
 * });
 */
function beforeEach () {
  var expressApp = arguments[0]
    , callback = arguments[arguments.length - 1]
    , beforeHandlers = flatten([].slice.call(arguments, 1, arguments.length - 1)) || []
    , fakeExpressApp = {}
    ;

  if (!expressApp) { return; }

  supportedHttpMethods.forEach(function (method) {
    fakeExpressApp[method] = function(path) {
      expressApp[method].call(expressApp, path, beforeHandlers, [].slice.call(arguments, 1));
    };
  });

  fakeExpressApp.beforeEach = expressApp.beforeEach;

  callback(fakeExpressApp);
}
module.exports.beforeEach = beforeEach;


/**
 * Set up groupings so that they can be called as a method of the express app
 */
module.exports.setup = function (expressApp) {
  expressApp.beforeEach = function () {
    var newArgs = [this], i;
    for (i = 0; i < arguments.length; i += 1) { newArgs.push(arguments[i]); }
    beforeEach.apply(null, newArgs);
  };
}



