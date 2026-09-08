import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Transaction {
    @Prop({
        required: true,
        index: true
    })
    nature: number;

    @Prop({
        required: false,
        index: true
    })
    txHash: string;

    @Prop({
        required: false,
        index: true
    })
    linkedTxHash: string;

    @Prop()
    amount: number;

    @Prop({ default: 0 })
    fee: number;

    @Prop()
    to: string;

    @Prop()
    tokenSymbol: string;

    @Prop({
        default: 0
    })
    confirmations: number;

    @Prop({
        required: false,
        index: true,
        default: 1
    })
    status: number; //0. Pending Broadcast, 1. Broadcasting, 2. Procesando, 3. Procesado, 4. Cancelado, 5. Broadcast Failed

    created_at?: Date;

    updated_at?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
 