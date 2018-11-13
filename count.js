const rdb = require('rethinkdb')
const async = require('async')

const utils = require('./reg-util.js')

function pendingCount(req, res, connection, logger) {
    let authToken = req.get('AuthToken')

    async.waterfall([
        checkCountParams(authToken),
        utils.getRoles(logger),
        utils.validateRole(logger, 'Admin', 'PendingCount'),
        getPendingCount
    ], utils.resultResponse(res))

    function checkCountParams(authToken) {
        return function(callback) {
            if (authToken == null) {
                logger.log({
                    level: 'error',
                    function: 'checkCountParams',
                    message: 'No AuthToken header provided'
                })
                callback('No AuthToken header provided', null)
            } else {
                callback(null, authToken)
            }
        }
    }

    function getPendingCount(username, name, roles, callback) {
        rdb.table('pending').run(connection, function(err, cursor) {
            if (err) {
                logger.log({
                    level: 'error',
                    function: 'getPendingCount',
                    message: 'RethinkDB encountered an error retrieving the pending table',
                    error: err
                })
                callback('RethinkDB encountered an error retrieving the pending table', err)
            } else {
                cursor.toArray(function(err, result) {
                    if (err) {
                        logger.log({
                            level: 'error',
                            function: 'getPendingCount',
                            message: 'Could not convert pending table toArray',
                            error: err
                        })
                        callback('Could not convert pending table toArray', err)
                    } else {
                        logger.log({
                            level: 'info',
                            function: 'getPendingCount',
                            message: `Current pending count is ${result.length}`
                        })
                        callback(null, `Current pending count is ${result.length}`, result.length)
                    }
                })
            }
        })
    }
}

module.exports = {
    pendingCount: pendingCount
}