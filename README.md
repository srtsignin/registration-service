# registration-service
For registering users with special permissions

## Setup

Remember to run the following command in rethinkdb to create the required index in the pending table:

```javascript
r = require('rethinkdb');
r.db('srtsignin').table('pending').indexCreate('timestamp')
```

## Endpoints

### POST /register/registration

**Header**
```js
AuthToken: authToken
```

**Response**
```js
{
    'message': 'Successfully added user to pending',
    'success': true,
    'data': {
        'timestamp': '2018-11-13T21:39:40.849Z',
        'username': 'username',
        'name': 'fullname'
    }
}
```

### GET /register/allPending

**Header**
```js
AuthToken: authToken
```

**Response**
```js
{
    'message': 'Receiving courses containing the following query string: queryString',
    'success': true,
    'data': [
        {
            'id': 'feabff45-2154-4530-81f2-a67f0e2b7fd3',
            'timestamp': '2018-11-13T21:39:40.849Z',
            'username': 'username',
            'name': 'fullname'
        }
    ]
}
```

### GET /register/count

**Header**
```js
'AuthToken': 'authToken'
```

**Response**
```js
{
    'message': 'Current pending count is 1',
    'success': true,
    'data': '5 (a number representing the length of the list)'
}
```

### POST /register/membershipDecision

**Header**
```js
'AuthToken': 'authToken'
```

**Body**
```js
{
    'username': 'username',
    'roles': ['Student', 'Tutor']
}
```

**Response**
```js
{
    'message': 'Successfully approved <username> and removed them from pending list',
    'success': true,
    'data': null
}
```

### DELETE /register/membershipDecision

**Header**
```js
'AuthToken': 'authToken'
```

**Body**
```js
{
    'username': 'username'
}
```

**Response**
```js
{
    'message': `Successfully removed <username> from pending list`,
    'success': true,
    'data': null
}
```