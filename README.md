Express Group Handlers
======================

**IMPORTANT: this library is not maintained anymore, please don't submit anymore pull requests except for bugfixes**

Apply a middleware before or after a group of route handlers in Express. No need to change your existing code, just call this function (see demos below).

## Install and test
The usual:
```bash
npm install express-group-handlers
npm test   # Be sure to install the dev dependencies if you want to test this module!
```

## Use
```javascript
var express = require('express')
  , app = express()
  , groupHandlers = require('express-group-handlers');

groupHandlers.setup(app);

app.get('/route1', finalHandler1);
app.get('/route2', finalHandler2);

app.beforeEach(groupHandler, function (app) {
  app.get('/route3', finalHandler3); // GET /route3 will execute groupHandler, then finalHandler3
  app.post('/route4', finalHandler4); // POST /route4 will execute groupHandler, then finalHandler4
  // Note that the syntax is the same than for /route1 and /route2
});

app.listen(3000);
```

The `groupHandlers.setup` function augments your Express app with two functions, `beforeEach` and `afterEach`. Both work the same way: you supply the middlewares you want to see executed before/after the handlers inside the callback. The callback has one parameter, which is a fake Express app with all router functions (`get`, `post`, `all` etc.). If you give it the same name as your real Express app (as in the example above), no need to change your existing code, just wrap the `beforeEach` function around it!

```javascript
// You can have multiple middlewares in beforeEach/afterEach
// You can use arrays of middlewares too
app.beforeEach(gh1, gh2, [gh3, gh4], ..., function (app) {
  // Your routes here
});

// Alternate syntax if you don't want to augment your Express app
// Just don't call groupHandlers.setup and use the functions directly like this
groupHandlers.beforeEach(app, groupHandler, function (app) {
  // Your routes here
});

// Yodawg, I put a beforeEach inside your beforeEach!
app.beforeEach(gh1, function (app) {
  app.get('/route1', finalHandler1); // Executes gh1, then finalHandler1
  app.get('/route2', finalHandler2); // Executes gh2, then finalHandler2
  
  app.beforeEach(gh2, function (app) {
    app.get('/route3', finalHandler3); // gh1, gh2 then finalHandler3
    app.get('/route4', finalHandler4); // gh1, gh2 then finalHandler4
  });
});
```

Of the above of course works with `afterEach`. Actually you can even nest `beforeEach` and `afterEach`.

## License
(The MIT License)

Copyright (c) 2013 tldr.io &lt;hello@tldr.io&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

