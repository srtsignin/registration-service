const rdb = require('rethinkdb')
const async = require('async')
const request = require('request')

const utils = require('./reg-util.js')

const config = require('./config/registration-config.json')


function approveMember(req, res, connection, logger) {
    let authToken = req.get('AuthToken')
    let username = req.body.username
    let roles = req.body.roles

    async.waterfall([
        checkApproveParams(authToken, username, roles),
        utils.getRoles(logger),
        utils.validateRole(logger, 'Admin', 'ApproveMembership'),
        getNameForUser(username),
        sendRegisterRequest(username, roles),
        removeApprovedUserFromPending
    ], utils.resultResponse(res))

    function checkApproveParams(authToken, username, newRoles) {
        return function(callback) {
            if (authToken == null) {
                logger.log({
                    level: 'error',
                    function: 'checkApproveParams',
                    message: 'No AuthToken header provided'
                })
                callback('No AuthToken header provided', null)
            } else if (username == null) {
                logger.log({
                    level: 'error',
                    function: 'checkApproveParams',
                    message: 'No username provided in the body'
                })
                callback('No username provided in the body', null)
            } else if (newRoles == null) {
                logger.log({
                    level: 'error',
                    function: 'checkApproveParams',
                    message: 'No roles provided in the body'
                })
                callback('No roles provided in the body', null)
            } else {
                logger.log({
                    level: 'verbose',
                    function: 'checkApproveParams',
                    message: 'Initial params provided',
                    username: username,
                    roles: newRoles
                })
                callback(null, authToken)
            }
        }
    }

    function getNameForUser(userToApprove) {
        return function(username, name, roles, callback) {
            rdb.table('pending').filter({username: userToApprove}).limit(1)
                .run(connection, function(err, cursor) {
                    if (err) {
                        logger.log({
                            level: 'error',
                            function: 'getNameForUser',
                            message: 'RethinkDB encountered an error fetching userToApprove',
                            error: err
                        })
                        callback('RethinkDB encountered an error fetching userToApprove', err)
                    } else {
                        cursor.toArray(function(err, result) {
                            if (err) {
                                logger.log({
                                    level: 'error',
                                    function: 'getNameForUser',
                                    message: 'Could not convert cursor toArray',
                                    error: err
                                })
                                callback('Could not convert cursor toArray', err)
                            } else if (result.length == 0) {
                                logger.log({
                                    level: 'error',
                                    function: 'getNameForUser',
                                    message: 'There are no users in the pending list'
                                })
                                callback('There are no users in the pending list', null)
                            } else {
                                logger.log({
                                    level: 'verbose',
                                    function: 'getNameForUser',
                                    message: `The userToApprove fullname is ${result[0].name}`
                                })
                                callback(null, result[0].name)
                            }
                        })
                    }
                })
        }
    }

    function sendRegisterRequest(userToApprove, roles) {
        return function(name, callback) {
            const options = {
                url: config.rolesService.url + "/users",
                method: 'POST',
                headers: {
                    'AuthToken': authToken
                },
                json: true,
                body: {
                    name: name,
                    username: userToApprove,
                    roles: roles
                }
            }
            request(options, function(err, response, body) {
                if (err) {
                    logger.log({
                        level: 'error',
                        function: 'sendRegisterRequest',
                        message: 'Error received from roleService',
                        error: err,
                        statusCode: response.statusCode
                    })
                    callback('Error received from roleService', err)
                } else {
                    logger.log({
                        level: 'verbose',
                        function: 'sendRegisterRequest',
                        message: 'Successfully registered user',
                        user: userToApprove,
                        roles: roles
                    })
                    callback(null, userToApprove)
                }
            })
        }
    }

    function removeApprovedUserFromPending(userToRemove, callback) {
        rdb.table('pending').filter({username: userToRemove}).delete()
            .run(connection, function(err, result) {
                if (err) {
                    logger.log({
                        level: 'error',
                        function: 'removeApprovedUserFromPending',
                        message: 'Rethinkdb encountered an error while removing a user from pending',
                        error: err
                    })
                    callback('Rethinkdb encountered an error while removing a user from pending', err)
                } else {
                    logger.log({
                        level: 'info',
                        function: 'removeApprovedUserFromPending',
                        message: `Successfully approved ${userToRemove} and removed them from pending list`
                    })
                    callback(null, `Successfully approved ${userToRemove} and removed them from pending list`, null)
                }
            })
    }
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