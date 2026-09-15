import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Provider, ProviderDocument } from '../providers/schemas/provider.schema';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';
import {
  sendP2POrderCreatedEmail,
  sendP2POrderFundedEmail,
  sendP2PPaymentConfirmedEmail,
  sendP2PFundsReleasedEmail,
  sendP2POrderCompletedEmail,
  sendP2POrderCancelledEmail,
  sendP2POrderExpiredEmail,
  sendP2PDisputeOpenedEmail,
} from './mail/mail-transporter';

type EscrowJobData = {
  orderId: string;
  status: string;
  sellerEmail?: string;
  providerEmail?: string;
  escrowTxHash?: string;
  disputeReason?: string;
  disputeOpenedBy?: string;
  resolutionType?: string;
};

@Injectable()
export class EscrowMailService {
  private readonly logger = new Logger('EscrowMailService');

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(EscrowOrder.name) private readonly escrowOrderModel: Model<EscrowOrderDocument>,
  ) {}

  // BUSCA EL NOMBRE PARA MOSTRAR DE UN USUARIO O PROVEEDOR DADO SU EMAIL
  private async resolveDisplayName(email: string): Promise<string> {
    if (!email) return 'Usuario';
    try {
      const user = await this.userModel
        .findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } })
        .select('firstName lastName')
        .lean()
        .exec();
      if (user && (user.firstName || user.lastName)) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
      const provider = await this.providerModel
        .findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } })
        .select('firstName lastName')
        .lean()
        .exec();
      if (provider && (provider.firstName || provider.lastName)) {
        return `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
      }
    } catch (err) {
      this.logger.warn(`[EscrowMail] Could not resolve name for ${email}: ${(err as Error).message}`);
    }
    return email;
  }

  // RECUPERA LOS DATOS COMPLETOS DE LA ORDEN DESDE LA BASE DE DATOS PARA ENRIQUECER EL EMAIL
  private async buildOrderData(data: EscrowJobData): Promise<Record<string, any>> {
    // Consultar la orden completa desde MongoDB para tener todos los campos del email
    const order = await this.escrowOrderModel
      .findOne({ orderId: data.orderId })
      .lean()
      .exec();

    if (!order) {
      this.logger.warn(`[EscrowMail] Order not found in DB for orderId=${data.orderId}, using job data only`);
    }

    return {
      orderId: data.orderId,
      status: data.status,
      coin: order?.coin || '',
      amount: order?.amount ?? 0,
      fiatAmount: order?.fiatAmount ?? 0,
      paymentMethod: order?.paymentMethod || '',
      sellerWalletAddress: order?.sellerWalletAddress || '',
      chatroomId: order?.chatroomId || '',
      expiresAt: order?.expiresAt || '',
      sellerEmail: data.sellerEmail || order?.sellerEmail,
      providerEmail: data.providerEmail || order?.providerEmail,
      disputeReason: data.disputeReason || order?.disputeReason,
      disputeOpenedBy: data.disputeOpenedBy || order?.disputeOpenedBy,
      escrowTxHash: data.escrowTxHash || order?.escrowTxHash,
    };
  }

  // PUNTO DE ENTRADA PRINCIPAL: DESPACHA EL EMAIL CORRECTO SEGUN EL ESTADO DE LA ORDEN
  async notifyEscrowEvent(data: EscrowJobData): Promise<void> {
    const { status, sellerEmail, providerEmail, orderId } = data;
    if (!status || !orderId) return;

    this.logger.log(`[EscrowMail] Dispatching notification for orderId=${orderId} status=${status}`);

    const orderData = await this.buildOrderData(data);

    try {
      switch (status) {
        case 'pending':
          await this.onOrderCreated(orderData, sellerEmail, providerEmail);
          break;
        case 'funded':
          await this.onOrderFunded(orderData, sellerEmail, providerEmail);
          break;
        case 'buyer_paid':
          await this.onPaymentConfirmed(orderData, sellerEmail);
          break;
        case 'released':
          await this.onFundsReleased(orderData, providerEmail);
          break;
        case 'completed':
          await this.onOrderCompleted(orderData, sellerEmail, providerEmail);
          break;
        case 'cancelled':
          await this.onOrderCancelled(orderData, sellerEmail, providerEmail);
          break;
        case 'expired':
          await this.onOrderExpired(orderData, sellerEmail, providerEmail);
          break;
        case 'disputed':
          await this.onDisputeOpened(orderData, sellerEmail, providerEmail);
          break;
        default:
          this.logger.debug(`[EscrowMail] No email template for status: ${status}`);
      }
    } catch (err) {
      this.logger.warn(`[EscrowMail] Error in notifyEscrowEvent orderId=${orderId}: ${(err as Error).message}`);
    }
  }

  // ENVIA EMAILS DE CREACION DE ORDEN AL VENDEDOR Y AL PROVEEDOR
  private async onOrderCreated(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      await sendP2POrderCreatedEmail(orderData, sellerEmail, 'seller');
      this.logger.log(`[EscrowMail] sent [pending/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      await sendP2POrderCreatedEmail(orderData, providerEmail, 'provider');
      this.logger.log(`[EscrowMail] sent [pending/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAILS DE FONDOS EN ESCROW AL VENDEDOR Y AL PROVEEDOR
  private async onOrderFunded(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      await sendP2POrderFundedEmail(orderData, sellerEmail);
      this.logger.log(`[EscrowMail] sent [funded/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      await sendP2POrderFundedEmail(orderData, providerEmail);
      this.logger.log(`[EscrowMail] sent [funded/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAIL DE PAGO CONFIRMADO SOLO AL VENDEDOR PARA QUE LIBERE LOS FONDOS
  private async onPaymentConfirmed(orderData: Record<string, any>, sellerEmail?: string) {
    if (sellerEmail) {
      await sendP2PPaymentConfirmedEmail(orderData, sellerEmail);
      this.logger.log(`[EscrowMail] sent [buyer_paid/seller] → ${sellerEmail}`);
    }
  }

  // ENVIA EMAIL DE FONDOS LIBERADOS SOLO AL PROVEEDOR QUE RECIBE LA CRIPTO
  private async onFundsReleased(orderData: Record<string, any>, providerEmail?: string) {
    if (providerEmail) {
      await sendP2PFundsReleasedEmail(orderData, providerEmail);
      this.logger.log(`[EscrowMail] sent [released/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAILS DE ORDEN COMPLETADA A AMBAS PARTES
  private async onOrderCompleted(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      await sendP2POrderCompletedEmail(orderData, sellerEmail, 'seller');
      this.logger.log(`[EscrowMail] sent [completed/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      await sendP2POrderCompletedEmail(orderData, providerEmail, 'provider');
      this.logger.log(`[EscrowMail] sent [completed/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAILS DE CANCELACION A AMBAS PARTES
  private async onOrderCancelled(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      await sendP2POrderCancelledEmail(orderData, sellerEmail, 'seller');
      this.logger.log(`[EscrowMail] sent [cancelled/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      await sendP2POrderCancelledEmail(orderData, providerEmail, 'provider');
      this.logger.log(`[EscrowMail] sent [cancelled/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAILS DE EXPIRACION AL VENDEDOR Y AL PROVEEDOR
  private async onOrderExpired(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      await sendP2POrderExpiredEmail(orderData, sellerEmail);
      this.logger.log(`[EscrowMail] sent [expired/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      await sendP2POrderExpiredEmail(orderData, providerEmail);
      this.logger.log(`[EscrowMail] sent [expired/provider] → ${providerEmail}`);
    }
  }

  // ENVIA EMAILS DE DISPUTA A AMBAS PARTES Y A LOS ADMINS CONFIGURADOS EN LA VARIABLE DE ENTORNO
  private async onDisputeOpened(orderData: Record<string, any>, sellerEmail?: string, providerEmail?: string) {
    if (sellerEmail) {
      const role = orderData.disputeOpenedBy === sellerEmail ? 'seller' : 'provider';
      await sendP2PDisputeOpenedEmail(orderData, sellerEmail, role);
      this.logger.log(`[EscrowMail] sent [disputed/seller] → ${sellerEmail}`);
    }
    if (providerEmail) {
      const role = orderData.disputeOpenedBy === providerEmail ? 'provider' : 'seller';
      await sendP2PDisputeOpenedEmail(orderData, providerEmail, role);
      this.logger.log(`[EscrowMail] sent [disputed/provider] → ${providerEmail}`);
    }
    // NOTIFICAR A LOS ADMINISTRADORES CONFIGURADOS VIA ADMIN_EMAILS
    const adminEmailsRaw = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsRaw.split(',').map(e => e.trim()).filter(Boolean);
    for (const adminEmail of adminEmails) {
      await sendP2PDisputeOpenedEmail(orderData, adminEmail, 'admin');
      this.logger.log(`[EscrowMail] sent [disputed/admin] → ${adminEmail}`);
    }
  }
}
