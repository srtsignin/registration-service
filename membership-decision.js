const rdb = require('rethinkdb')
const async = require('async')

const utils = require('./reg-util.js')

function approveMember(req, res, connection, logger) {

}

function declineMember(req, res, connection, logger) {
    let authToken = req.get('AuthToken')
    let username = req.body.username

    async.waterfall([
        checkDeclineParams(authToken, username),
        utils.getRoles(logger),
        utils.validateRole(logger, 'Admin', 'DeclineMembership'),
        removeUserFromPending(username)
    ], utils.resultResponse(res))

    function checkDeclineParams(authToken, username) {
        return function(callback) {
            if (authToken == null) {
                logger.log({
                    level: 'error',
                    function: 'checkDeclineParams',
                    message: 'No AuthToken header provided'
                })
                callback('No AuthToken header provided', null)
            } else if (username == null) {
                logger.log({
                    level: 'error',
                    function: 'checkDeclineParams',
                    message: 'No username provided in the body'
                })
                callback('No username provided in the body', null)
            } else {
                logger.log({
                    level: 'verbose',
                    function: 'checkDeclineParams',
                    message: 'Initial params provided',
                    username: username
                })
                callback(null, authToken)
            }
        }
    }

    function removeUserFromPending(userToRemove) {
        return function(username, name, roles, callback) {
            rdb.table('pending').filter({username: userToRemove}).delete()
                .run(connection, function(err, result) {
                    if (err) {
                        logger.log({
                            level: 'error',
                            function: 'removeUserFromPending',
                            message: 'Rethinkdb encountered an error while removing a user from pending',
                            error: err
                        })
                        callback('Rethinkdb encountered an error while removing a user from pending', err)
                    } else {
                        logger.log({
                            level: 'info',
                            function: 'removeUserFromPending',
                            message: `Successfully removed ${userToRemove} from pending list`
                        })
                        callback(null, `Successfully removed ${userToRemove} from pending list`, null)
                    }
                })
        }
    }
}

module.exports = {
    approveMember:approveMember,
    declineMember:declineMember
}