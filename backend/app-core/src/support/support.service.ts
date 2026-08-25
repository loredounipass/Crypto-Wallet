import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { ChatQueryDto } from './dto/chat-query.dto';

@Injectable()
export class SupportService implements OnModuleInit {
    private readonly apiKey: string;
    private readonly apiUrl: string;
    private appContext: string = '';

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
    ) {
        this.apiKey = this.configService.get<string>('NVIDIA_API_KEY') || '';
        this.apiUrl = this.configService.get<string>('NVIDIA_API_URL') || 'http://localhost:11434/v1/chat/completions';
    }



    // SE EJECUTA AUTOMATICAMENTE AL INICIAR EL MODULO PARA CARGAR EN MEMORIA EL CONTEXTO DE LA APLICACION
    async onModuleInit() {
        this.appContext = await this.loadContext();
    }



    // LEE EL ARCHIVO JSON LOCAL Y EXTRAE LAS INSTRUCCIONES FORMATEANDO EL TEXTO PARA ALIMENTAR A LA INTELIGENCIA ARTIFICIAL
    private async loadContext(): Promise<string> {
        try {
            const contextPath = path.join(__dirname, 'contextapp.json');
            const raw = await fs.promises.readFile(contextPath, 'utf-8');
            const parsed = JSON.parse(raw);
            const features = parsed.features.map(f =>
                `### ${f.title}\n${f.steps.join('\n')}`
            ).join('\n\n');
            return `\n\nInformacion de la aplicacion BrivoTrust:\n${features}`;
        } catch {
            return '';
        }
    }



    // GESTIONA EL FLUJO DE COMUNICACION CON LA IA Y REGISTRA TANTO LA PREGUNTA COMO LA RESPUESTA EN LA BASE DE DATOS
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



    // CONSTRUYE Y ENVIA LA PETICION HTTP HACIA LA API EXTERNA O LOCAL DEL MODELO DE LENGUAJE CONFIGURADO
    private async callAiApi(message: string): Promise<string> {
        try {
            const { data } = await axios.post<any>(
                this.apiUrl,
                {
                    model: this.inferModel(),
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres Brivo Agent, un asistente AI de BrivoTrust. Responde preguntas sobre la plataforma usando la informacion de abajo. Si la pregunta no esta cubierta, responde con honestidad que no tienes esa informacion. Reglas: 1) Sé conciso — responde solo lo necesario, sin introducciones ni despedidas. 2) Estilo limpio como Google: directo al grano. 3) Siempre en español. 4) Cuando des instrucciones, usa numeros y pasos claros.' + this.appContext,
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
                return 'No se recibio respuesta del asistente.';
            }
            if (content.includes('Cannot read') || content.includes('does not support image')) {
                return 'El asistente esta teniendo problemas de configuracion. Contacta al administrador.';
            }
            return content;
        } catch (err) {
            const axiosErr = err as { response?: { data?: unknown } } | undefined;
            const errData = axiosErr?.response?.data;
            const errStr = typeof errData === 'string' ? errData : JSON.stringify(errData || '');
            if (errStr.includes('Cannot read') || errStr.includes('does not support image')) {
                return 'El asistente esta teniendo problemas de configuracion. Contacta al administrador.';
            }
            throw err;
        }
    }



    // DETERMINA AUTOMATICAMENTE QUE MODELO DE LENGUAJE UTILIZAR BASANDOSE EN LAS VARIABLES DE ENTORNO DISPONIBLES
    private inferModel(): string {
        const configured = this.configService.get<string>('NVIDIA_MODEL');
        if (configured) return configured;
        if (this.apiUrl.includes('nvidia')) return 'meta/llama-3.1-8b-instruct';
        return 'llama3';
    }
}
