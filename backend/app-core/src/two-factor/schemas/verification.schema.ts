import { Schema, Document } from 'mongoose';

export const TokenSchema = new Schema({
  email: { type: String, required: true },
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // TTL: 5 minutes (match service)
  isValid: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Number },
  lastAttemptAt: { type: Number } // VULN-04 FIX: Track when the last failed attempt occurred
});

export interface Token extends Document {
  email: string;
  tokenHash: string;
  createdAt: Date;
  isValid: boolean;
  attempts: number;
  lastSentAt?: number;
  lastAttemptAt?: number;
}
