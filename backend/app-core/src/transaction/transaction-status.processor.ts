import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TransactionGateway } from './transaction.gateway';
import QueueType from '../wallet/queue/types.queue';

@Processor(QueueType.TRANSACTION_STATUS_EVENTS)
@Injectable()
export class TransactionStatusProcessor extends WorkerHost {
  private readonly logger = new Logger('TransactionStatusProcessor');

  constructor(private readonly transactionGateway: TransactionGateway) {
    super();
  }



  // PROCESA LOS TRABAJOS ENCOLADOS Y EMITE EVENTOS DE ACTUALIZACION DE ESTADO A TRAVES DEL GATEWAY DE WEBSOCKETS
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
