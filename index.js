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
 * beforeEach(expressApp, middleware, function(app) {
 *   app.get('/route1', handler1);
 *   app.post('/route2', handler2);
 * });
 */
module.exports.beforeEach = function () {
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

  callback(fakeExpressApp);
};

