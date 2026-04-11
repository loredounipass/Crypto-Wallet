const isLocalRun = !process.env.CI
const dbHost = isLocalRun && process.env.DB_HOST === 'mongodb'
    ? '127.0.0.1'
    : process.env.DB_HOST
const dbPort = isLocalRun && String(process.env.DB_PORT) === '27017'
    ? '27020'
    : process.env.DB_PORT
const uri = `mongodb://${dbHost}:${dbPort}/${process.env.DB_NAME}`
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

module.exports = mongoose.connect(uri,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
