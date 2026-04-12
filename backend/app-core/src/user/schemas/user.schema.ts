import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({
        required: true,
        unique: true
    })
    email: string;

    @Prop({
        required: true
    })
    password: string;


    _id?: string; 

    // Email verification flag retained for account verification flows
    @Prop({ default: false })
    isValid: boolean;

    @Prop({ default: false })
    isTokenEnabled: boolean;
    
    // Campos para restablecimiento de contraseña
    @Prop()
    resetPasswordTokenHash?: string;

    @Prop()
    resetPasswordTokenPurpose?: string;

    @Prop({ default: false })
    resetPasswordTokenUsed?: boolean;

    @Prop()
    resetPasswordExpires?: Date;

    @Prop()
    resetPasswordLastSentAt?: number;
    
    @Prop()
    lastPasswordChange?: number;
    
    @Prop()
    lastProfileUpdate?: number;
    
}

export const UserSchema = SchemaFactory.createForClass(User);
