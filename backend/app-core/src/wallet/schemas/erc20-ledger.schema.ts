import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type Erc20LedgerDocument = Erc20Ledger & Document;

@Schema({ collection: 'erc20ledgers' })
export class Erc20Ledger {
    @Prop({ required: true, index: true })
    walletAddress: string;

    @Prop({ required: true, index: true })
    tokenAddress: string;

    @Prop({ required: true })
    chainId: number;

    @Prop({ required: true, default: 0 })
    available_balance: number;

    @Prop({ required: true, default: 0 })
    locked_for_forward: number;

    @Prop({ default: Date.now })
    updated_at: Date;

    @Prop({ default: false })
    aggregatorLock: boolean;

    @Prop({ default: null })
    aggregatorLockedAt: Date;

    @Prop({ default: 'IDLE' })
    aggregatorState: string;

    @Prop({ default: 0 })
    forwarded_total: number;
}

export const Erc20LedgerSchema = SchemaFactory.createForClass(Erc20Ledger);
Erc20LedgerSchema.index({ chainId: 1, walletAddress: 1, tokenAddress: 1 }, { unique: true });
