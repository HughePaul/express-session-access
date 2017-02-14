# express-session-access
Manipulate your express session via an API in test environments.

This is usefull for seeding session data dynamically during integration tests.

*Do not use in a production environment*

## Usage


```
const sessionAccess = require('express-session-access');
const express = require('express');
const session = require('express-session');

let app = express();

app.use(session());

app.use('/session', sessionAccess());
```

Updating access can be limited with whitelisting:

```
app.use('/session', sessionAccess(['user.data', 'settings']));
```

A GET request will return the entire session object as JSON.

A POST request will merge the whitelisted items in the JSON post body with the session.
