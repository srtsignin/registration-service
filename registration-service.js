const rdb = require('rethinkdb')
const express = require('express')
const app = express()
const async = require('async')
const bodyParser = require('body-parser')
const {createLogger, format, transports} = require('winston')

const config = require('./config/registration-config.json')
const jsonParser = bodyParser.json()

const allPending = require('./all-pending.js')
const registration = require('./registration.js')
const membershipDecision = require('./membership-decision.js')

app.get('/allPending', (req, res) => {
    allPending.getAllPending(req, res, app._rdbConn, app.logger)
})

app.get('/count', (req, res) => {

})

app.post('/membershipDecision', jsonParser, (req, res) => {

})

app.delete('/membershipDecision', jsonParser, (req, res) => {
    membershipDecision.declineMember(req, res, app._rdbConn, app.logger)
})

app.post('/registration', (req, res) => {
    registration.registerUser(req, res, app._rdbConn, app.logger)
})

/*** INITIALIZATION FUNCTIONS ***/

function startExpress(connection) {
    app._rdbConn = connection
    app.logger = createLogger({
        level: 'verbose',
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
        transports: [
            new transports.Console()
        ]
    })
    app.listen(config.express.port, () => console.log(`Active User Service listening on port ${config.express.port}!`))
}

function connect(callback) {
    rdb.connect(config.rethinkdb, callback)
}

function checkForTables(connection, callback) {
    rdb.tableList().contains('pending').run(connection, function (err, result) {
        if (err == null && !result) {
            err = new Error('"pending" table does not exist!')
        }
        callback(err, connection)
    })
}

async.waterfall([
    connect,
    checkForTables
], function (err, connection) {
    if (err) {
        console.error(err)
        process.exit(1)
        return
    }
    startExpress(connection)
});