const rdb = require('rethinkdb')
const async = require('async')

const utils = require('./reg-util.js')

function getAllPending(req, res, connection, logger) {
    let authToken = req.get('AuthToken')
    async.waterfall([
        checkPendingParams(authToken),
        utils.getRoles(logger),
        utils.validateRole(logger, 'Admin', '/allPending'),
        getAllPendingUsers
    ], utils.resultResponse(res))

    function checkPendingParams(authToken) {
        return function(callback) {
            if (authToken == null) {
                logger.log({
                    level: 'error',
                    function: 'checkPendingParams',
                    message: 'No AuthToken provided'
                })
                callback('No AuthToken provided', null)
            } else {
                logger.log({
                    level: 'verbose',
                    function: 'checkPendingParams',
                    message: 'request contains AuthToken'
                })
                callback(null, authToken)
            }
        }
    }

    function getAllPendingUsers(username, name, roles, callback) {
        rdb.table('pending').orderBy({index: rdb.desc('timestamp')}).run(connection, function(err, cursor) {
            if (err) {
                logger.log({
                    level: 'error',
                    function: 'getAllPendingUsers',
                    message: `RethinkDB encountered an error`,
                    error: err
                })
                callback('RethinkDB encountered an error', err)
            } else {
                cursor.toArray(function(err, result) {
                    if (err) {
                        logger.log({
                            level: 'error',
                            function: 'getAllPendingUsers',
                            message: `error ocurred retrieving pending users: ${err}`
                        })
                        callback('error ocurred retrieving pending users', err)
                    } else {
                        logger.log({
                            level: 'verbose',
                            function: 'getAllPendingUsers',
                            message: 'Successfully retrieved pending users'
                        })
                        callback(null, 'Successfully retrieved pending users', result)
                    }
                })
            }
        })
    }
}

module.exports = {
    getAllPending: getAllPending
}