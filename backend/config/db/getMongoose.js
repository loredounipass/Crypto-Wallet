const uri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

module.exports = mongoose.connect(uri,
    { useNewUrlParser: true, useUnifiedTopology: true }
)