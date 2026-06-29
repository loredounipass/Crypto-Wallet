const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const mongoUser = process.env.DB_USER || ''
const mongoPass = process.env.DB_PASS || ''
const auth = mongoUser && mongoPass ? `${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPass)}@` : ''

const isLocalRun = !process.env.CI && !process.env.DOCKER
const dbHost = isLocalRun && process.env.DB_HOST === 'mongodb'
    ? '127.0.0.1'
    : process.env.DB_HOST
const dbPort = isLocalRun && String(process.env.DB_PORT) === '27017'
    ? '27020'
    : process.env.DB_PORT
const uri = `mongodb://${auth}${dbHost}:${dbPort}/${process.env.DB_NAME}?authSource=admin`

module.exports = mongoose.connect(uri, {
  connectTimeoutMS: 90000,
  serverSelectionTimeoutMS: 90000,
  socketTimeoutMS: 90000,
})
