import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TransactionGateway } from './transaction.gateway';
import QueueType from '../wallet/queue/types.queue';

@Processor(QueueType.TRANSACTION_STATUS_EVENTS)
export class TransactionStatusProcessor extends WorkerHost {
  private readonly logger = new Logger('TransactionStatusProcessor');

  constructor(private readonly transactionGateway: TransactionGateway) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'status-update') {
      return;
    }

    try {
      await this.transactionGateway.emitTransactionStatus(job.data);
    } catch (error) {
      this.logger.warn(`Failed processing status update job ${job.id}: ${error}`);
      throw error;
    }
  }
}
