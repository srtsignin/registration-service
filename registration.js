const rdb = require('rethinkdb')
const async = require('async')

const utils = require('./reg-util.js')

function registerUser(req, res, connection, logger) {
    let authToken = req.get('AuthToken')

    async.waterfall([
        checkRegParams(authToken),
        utils.getRoles(logger),
        utils.validateRole(logger, null, 'Registration'),
        isUserAlreadyRegistered,
        isUserAlreadyPending,
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

    function isUserAlreadyRegistered(username, name, roles, callback) {
        if (roles.length == 0) {
            logger.log({
                level: 'error',
                function: 'isUserAlreadyRegistered',
                message: 'User is not authorized to use the system'
            })
            callback('User is not authorized to use the system', null)
        }
        else if (roles.length == 1 && roles.includes('Student')) {
            logger.log({
                level: 'verbose',
                function: 'isUserAlreadyRegistered',
                message: 'User is not currently registered for anything'
            })
            callback(null, username, name)
        } else {
            logger.log({
                level: 'error',
                function: 'isUserAlreadyRegistered',
                message: 'User is already registered for a special role'
            })
            callback('User is already registered for a special role', null)
        }
    }

    function isUserAlreadyPending(username, name, callback) {
        rdb.table('pending').filter({username: username})
            .run(connection, function(err, result) {
                if (err) {
                    logger.log({
                        level: 'error',
                        function: 'isUserAlreadyPending',
                        message: 'An error occured getting the pending users from RethinkDB',
                        error: err
                    })
                    callback('An error occured getting the pending users from RethinkDB', null)
                } else {
                    result.toArray(function(err, result) {
                        if (err) {
                            logger.log({
                                level: 'error',
                                function: 'isUserAlreadyPending',
                                message: 'Could not convert RethinkDB result toArray',
                                error: err
                            })
                            callback('Could not convert RethinkDB result toArray', null)
                        } else {
                            if (result.length != 0) {
                                logger.log({
                                    level: 'info',
                                    function: 'isUserAlreadyPending',
                                    message: `User ${username} is already in the pending list`
                                })
                                callback(`User ${username} is already in the pending list`, null)
                            } else {
                                logger.log({
                                    level: 'verbose',
                                    function: 'isUserAlreadyPending',
                                    message: `User ${username} is not already pending`
                                })
                                callback(null, username, name)
                            }
                        }
                    })
                }
            })
    }

    function addUserToPending(username, name, callback) {
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