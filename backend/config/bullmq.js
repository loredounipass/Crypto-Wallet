const { Worker, Queue } = require('bullmq')

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
}

class CustomWorker extends Worker {
    constructor(name, processor, opts = {}) {
        super(name, processor, { connection, ...opts })
    }
}

class CustomQueue extends Queue {
    constructor(name, opts = {}) {
        super(name, { connection, ...opts })
    }
}

module.exports = {
    Worker: CustomWorker,
    Queue: CustomQueue
}
