Express Group Handlers
======================

Apply a middleware before or after to a group of route handlers in Express. No need to change your existing code, just call this function (see demos below).

## Install and test
The usual:
```bash
npm install express-group-handlers
npm test
```

## Use
```javascript
var express = require('express')
  , app = express()
  , groupHandlers = require('express-group-handlers');

groupHandlers.setup(app);

app.get('/route1', normalHandler1)
app.get('/route2', normalHandler2)

app.beforeEach(groupHandler, function (app) {
  app.get('/route3', normalHandler3) // GET /route3 will execute groupHandler, then normalHandler3
  app.post('/route4', normalHandler4) // POST /route4 will execute groupHandler, then normalHandler4
  // Note that the syntax is the same than for /route1 and /route2
});


app.listen(3000)
```
