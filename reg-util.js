const request = require('request')

const config = require('./config/registration-config.json')

function resultResponse(res) {
    return function(err, message, data)  {
        if (err) {
            res.status(400)
            res.json({
                'message': err,
                'success': false,
                'data': null
            })
        } else {
            res.status(200)
            res.json({
                'message': message,
                'success': true,
                'data': data
            })
        }
    }
}

function getRoles(logger) { 
    return function( authToken, callback) {
        const options = {
            url: config.rolesService.url + "/roles",
            method: 'GET',
            headers: {
                'AuthToken': authToken
            }
        }
        request.get(options, function(err, response, body) {
            if (err) {
                logger.log({
                    level: 'error',
                    function: 'getRoles',
                    message: `An error ocurred getting roles, error: ${err}`,
                    body: body,
                    response: response && response.statusCode,
                    authToken: authToken,
                })
                callback(err, null)
            } else {
                logger.log({
                    level: 'verbose',
                    function: 'getRoles',
                    message: `Unpacking response`,
                    body: body,
                    response: response && response.statusCode,
                    authToken: authToken,
                })
                let userInfo = JSON.parse(body)
                logger.log({
                    level: 'info',
                    function: 'getRoles',
                    message: `Success`,
                    userInfo: userInfo,
                })
                let roles = userInfo.roles
                let username = userInfo.user.username
                let name = userInfo.user.name
                callback(null, username, name, roles)
            }
        })
    }
}

function validateRole(logger, role, task) {
    return function(username, name, roles, callback) {
        if (role == null) {
            logger.log({
                level: 'verbose',
                function: 'validateRole',
                message: 'Ignoring validation step and returning results'
            })
            callback(null, username, name, roles)
        } else if (roles.includes(role)) {
            logger.log({
                level: 'verbose',
                function: 'validateRole',
                message: `User ${username} has permission for ${task}`
            })
            callback(null, username, name, roles)  
        } else {
            logger.log({
                level: 'error',
                function: 'validateRole',
                message: `User ${username} does not have permission for ${task}`
            })
            callback(`User ${username} does not have permission for ${task}`, null)
        }
    }
}

function getTimeString() {
    date = new Date()
    return date.toISOString()
}

module.exports = {
    resultResponse: resultResponse,
    getRoles: getRoles,
    validateRole: validateRole,
    getTimeString: getTimeString
}