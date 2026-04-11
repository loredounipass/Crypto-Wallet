const { Worker, Queue } = require('bullmq')

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
}

class CustomWorker extends Worker {
    constructor(name, processor, opts = {}) {
        super(name, processor, { connection, ...opts })
        this.on('active', (job) => {
            console.log(`[WORKER][${name}] active jobId=${job.id} name=${job.name}`)
        })
        this.on('completed', (job) => {
            console.log(`[WORKER][${name}] completed jobId=${job.id} name=${job.name}`)
        })
        this.on('failed', (job, err) => {
            const jobId = job ? job.id : 'unknown'
            const jobName = job ? job.name : 'unknown'
            console.error(`[WORKER][${name}] failed jobId=${jobId} name=${jobName} error=${err.message || err}`)
        })
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
