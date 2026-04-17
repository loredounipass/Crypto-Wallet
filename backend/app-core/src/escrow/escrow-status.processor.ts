import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EscrowGateway } from './escrow.gateway';

@Processor('escrow-status-events')
export class EscrowStatusProcessor extends WorkerHost {
  private readonly logger = new Logger('EscrowStatusProcessor');

  constructor(private readonly escrowGateway: EscrowGateway) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { orderId, status, sellerEmail, providerEmail, disputeReason, disputeOpenedBy } = job.data;
    this.logger.log(`Processing escrow status event: orderId=${orderId} status=${status}`);

    this.escrowGateway.emitEscrowStatusUpdate({
      orderId,
      status,
      sellerEmail,
      providerEmail,
      disputeReason,
      disputeOpenedBy,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.warn(`Escrow status event failed jobId=${job.id}: ${error.message}`);
  }
}
