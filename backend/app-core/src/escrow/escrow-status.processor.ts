import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EscrowGateway } from './escrow.gateway';
import { EscrowMailService } from './escrow-mail.service';

@Processor('escrow-status-events')
@Injectable()
export class EscrowStatusProcessor extends WorkerHost {
  private readonly logger = new Logger('EscrowStatusProcessor');

  constructor(
    private readonly escrowGateway: EscrowGateway,
    private readonly escrowMailService: EscrowMailService,
  ) {
    super();
  }



  // RECIBE LAS TAREAS DE LA COLA Y EMITE LOS EVENTOS A TRAVES DEL WEBSOCKET PARA ACTUALIZAR EL FRONTEND
  async process(job: Job): Promise<void> {
    const { orderId, status, sellerEmail, providerEmail, disputeReason, disputeOpenedBy, resolutionType } = job.data;
    this.logger.log(`Processing escrow status event: orderId=${orderId} status=${status}`);
    await this.escrowGateway.emitEscrowStatusUpdate({
      orderId,
      status,
      sellerEmail,
      providerEmail,
      disputeReason,
      disputeOpenedBy,
      resolutionType,
    });
    // DISPARA EL EMAIL DE NOTIFICACION SIN BLOQUEAR EL PROCESADOR DE LA COLA
    this.escrowMailService.notifyEscrowEvent(job.data).catch((err: Error) =>
      this.logger.warn(`[EscrowMail] Failed to send notification for orderId=${orderId}: ${err?.message}`)
    );
  }



  // REGISTRA UNA ADVERTENCIA EN LOS LOGS SI LA TAREA DE ACTUALIZACION DE ESTADO FALLA POR ALGUN MOTIVO
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.warn(`Escrow status event failed jobId=${job.id}: ${error.message}`);
  }
}
