import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { ChatQueryDto } from './dto/chat-query.dto';

@Injectable()
export class SupportService {
    private readonly apiKey: string;
    private readonly apiUrl: string;

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    ) {
        this.apiKey = this.configService.get<string>('NVIDIA_API_KEY') || '';
        this.apiUrl = this.configService.get<string>('NVIDIA_API_URL') || 'http://localhost:11434/v1/chat/completions';
    }

    async query(dto: ChatQueryDto, userEmail: string): Promise<{ response: string }> {
        let aiResponse: string;
        try {
            aiResponse = await this.callAiApi(dto.message);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            throw new InternalServerErrorException(`Error al contactar el asistente: ${message}`);
        }

        await this.chatMessageModel.create({
            userEmail,
            message: dto.message,
            response: aiResponse,
        });

        return { response: aiResponse };
    }

    private async callAiApi(message: string): Promise<string> {
        const { data } = await axios.post(
            this.apiUrl,
            {
                model: this.inferModel(),
                messages: [
                    {
                        role: 'system',
                        content: 'Eres Brivo Agent, un asistente AI profesional y directo. Reglas: 1) Sé conciso — responde solo lo necesario, sin introducciones ni despedidas. 2) Si te piden código, responde SOLO el código, sin explicaciones. 3) Estilo limpio como Google: directo al grano. 4) Siempre en español.',
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                max_tokens: 512,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
                },
                timeout: 30000,
            },
        );

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('La API no devolvió contenido en la respuesta.');
        }
        if (content.includes('Cannot read') || content.includes('does not support image')) {
            return 'Lo siento, hubo un error de configuración con el modelo. Por favor, contacta al administrador.';
        }
        return content;
    }

    private inferModel(): string {
        const configured = this.configService.get<string>('NVIDIA_MODEL');
        if (configured) return configured;
        if (this.apiUrl.includes('nvidia')) return 'meta/llama-3.1-8b-instruct';
        return 'llama3';
    }
}
