import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EscrowOrderDocument = EscrowOrder & Document;

@Schema({ timestamps: true })
export class EscrowOrder {
    @Prop({ required: true, unique: true, index: true })
    orderId: string;

    @Prop({ required: true, index: true })
    sellerEmail: string;

    @Prop({ required: true, index: true })
    providerEmail: string;

    @Prop({ required: true })
    sellerWalletAddress: string;

    @Prop({ required: true })
    providerWalletAddress: string;

    @Prop({ required: true })
    coin: string;

    @Prop({ required: true })
    chainId: number;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    fiatAmount: number;

    @Prop({ required: true })
    paymentMethod: string;

    // pending → funded → buyer_paid → released → completed
    // Also: disputed, refunded, cancelled, expired
    @Prop({ required: true, default: 'pending', index: true })
    status: string;

    @Prop()
    chatroomId: string;

    @Prop()
    escrowTxHash: string;

    @Prop()
    releaseTxHash: string;

    @Prop({ default: false })
    buyerConfirmedPayment: boolean;

    @Prop({ default: false })
    sellerConfirmedRelease: boolean;

    @Prop()
    disputeReason: string;

    @Prop()
    disputeOpenedBy: string;

    @Prop()
    expiresAt: Date;
}

export const EscrowOrderSchema = SchemaFactory.createForClass(EscrowOrder);
