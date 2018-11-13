const rdb = require('rethinkdb')
const async = require('async')

const utils = require('./reg-util.js')

function registerUser(req, res, connection, logger) {
    let authToken = req.get('AuthToken')

    async.waterfall([
        checkRegParams(authToken),
        utils.getRoles(logger),
        utils.validateRole(logger, 'Student', 'Registration'),
        addUserToPending
    ], utils.resultResponse(res))

    function checkRegParams(authToken) {
        return function(callback) {
            if (authToken == null) {
                logger.log({
                    level: 'error',
                    function: 'checkRegParams',
                    message: 'No AuthToken provided'
                })
                callback('No AuthToken provided', null)
            } else {
                logger.log({
                    level: 'verbose',
                    function: 'checkRegParams',
                    message: 'Parameters verified'
                })
                callback(null, authToken)
            }
        }
    }

    function addUserToPending(username, name, roles, callback) {
        let userObject = {
            timestamp: utils.getTimeString(),
            username: username,
            name: name
        }
        rdb.table('pending').insert(userObject).run(connection, function(err, result) {
            if (err) {
                logger.log({
                    level: 'error',
                    function: 'addUserToPending',
                    message: 'An error occurred inserting user into pending',
                    error: err
                })
                callback('An error occurred inserting user into pending', err)
            } else {
                logger.log({
                    level: 'info',
                    function: 'addUserToPending',
                    message: 'Successfully added user to pending',
                })
                callback(null, 'Successfully added user to pending', userObject)
            }
        })
    }
}

module.exports = {
    registerUser: registerUser
}