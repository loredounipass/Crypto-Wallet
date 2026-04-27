import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';


@Injectable()
export class EmailService {
  private readonly FROM_NAME = 'BlockVault';
  private readonly FROM_EMAIL = 'noreply@blockvault.com';
  private readonly FRONTEND_URL: string;
  
  private transporter: any;
  constructor(private readonly configService: ConfigService) {
    this.FRONTEND_URL = this.configService.get<string>('FRONTEND_URL') || 'https://tudominio.com';
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendTokenLogin(toEmail: string, token: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Token de verificación para iniciar sesión',
      html: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #003366; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .header { background-color: #115AF7; color: #ffffff; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 20px; background-color: #f4f4f4; border-radius: 8px; }
                .content p { line-height: 1.6; }
                .token { font-size: 32px; font-weight: bold; color: blue; text-align: center; margin: 20px 0; }
                .important { font-size: 20px; font-weight: bold; color: #ff5722; text-align: center; margin: 20px 0; }
                .security-tips { padding: 15px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin: 20px 0; }
                .security-tips h4 { font-size: 22px; color: #115AF7; margin: 0 0 10px; }
                .security-tips ul { padding-left: 20px; }
                .security-tips li { font-size: 18px; margin: 5px 0; }
                .footer { text-align: center; padding: 15px; font-size: 14px; color: #888; border-top: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BlockVault</h1>
                </div>
                <div class="content">
                    <p>Hola,</p>
                    <p>Ingresa los siguientes datos para confirmar que eres tú:</p>

                    <div class="token">
                     <span>TOKEN:</span> <strong>${token}</strong>
                    </div>

                    <p class="important">Token expirará en 5 minutos.</p>
                    <div class="security-tips">
                        <h4>Consejos para proteger tus fondos:</h4>
                        <ul>
                            <li>Utiliza contraseñas fuertes y únicas para tu cuenta.</li>
                            <li>Activa la autenticación de dos factores (2FA) siempre que sea posible.</li>
                            <li>No compartas tus claves privadas ni contraseñas con nadie.</li>
                            <li>Revisa regularmente tus transacciones y saldos.</li>
                            <li>Desconfía de enlaces y correos electrónicos sospechosos.</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>Gracias por usar BlockVault.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  }

  async generateToken(): Promise<string> {
    const num = randomInt(0, 1000000);
    await Promise.resolve();
    return String(num).padStart(6, '0');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.FRONTEND_URL}/verifyemail?token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: email,
      subject: 'Verifica tu correo electrónico',
      html: `
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body { font-family: Arial, sans-serif; background-color: #003366; margin:0; padding:0; color:#333 }
            .container { max-width:600px; margin:20px auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.15) }
            .header { background:linear-gradient(90deg,#115AF7,#0E1BCE); color:#fff; padding:18px; text-align:center }
            .header h1 { margin:0; font-size:24px }
            .content { padding:24px }
            .lead { font-size:16px; margin-bottom:18px }
            .button { display:inline-block; background:#115AF7; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:600 }
            .muted { color:#666; font-size:14px; margin-top:16px }
            .footer { background:#f4f4f4; padding:14px; text-align:center; font-size:13px; color:#666 }
            @media (max-width:420px){ .container{margin:10px} .content{padding:16px} }
          </style>
        </head>
        <body>
          <div class="container">
              <div class="header">
              <h1>BlockVault</h1>
            </div>
            <div class="content">
              <p class="lead">Hola,</p>
              <p>Por favor verifica tu correo electrónico haciendo clic en el botón de abajo para activar tu cuenta.</p>

              <p style="text-align:center; margin:24px 0"> 
                <a class="button" href="${verificationUrl}">Verificar correo</a>
              </p>

              <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p class="muted"><a href="${verificationUrl}">${verificationUrl}</a></p>

              <p class="muted">Este enlace expirará en 60 minutos. Si no solicitaste esta verificación, ignora este correo.</p>
            </div>
              <div class="footer">
              <div>Consejos para proteger tu cuenta: utiliza 2FA y no compartas tus credenciales.</div>
              <div style="margin-top:8px">Gracias por usar BlockVault.</div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo de verificación:', error);
    }
  }

  async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.FRONTEND_URL}/reset-password?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: email,
      subject: 'Restablece tu contraseña',
      html: `
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body { font-family: Arial, sans-serif; background-color: #003366; margin:0; padding:0; color:#333 }
            .container { max-width:600px; margin:20px auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.15) }
            .header { background:linear-gradient(90deg,#115AF7,#0E1BCE); color:#fff; padding:18px; text-align:center }
            .header h1 { margin:0; font-size:24px }
            .content { padding:24px }
            .lead { font-size:16px; margin-bottom:18px }
            .button { display:inline-block; background:#115AF7; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:600 }
            .muted { color:#666; font-size:14px; margin-top:16px }
            .footer { background:#f4f4f4; padding:14px; text-align:center; font-size:13px; color:#666 }
            @media (max-width:420px){ .container{margin:10px} .content{padding:16px} }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BlockVault</h1>
            </div>
            <div class="content">
              <p class="lead">Hola,</p>
              <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.</p>

              <p style="text-align:center; margin:24px 0"> 
                <a class="button" href="${resetUrl}">Restablecer contraseña</a>
              </p>

              <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p class="muted"><a href="${resetUrl}">${resetUrl}</a></p>

              <p class="muted">Este enlace expirará en 60 minutos. Si no solicitaste este restablecimiento, ignora este correo.</p>
            </div>
            <div class="footer">
              <div>Consejos para proteger tu cuenta: utiliza 2FA y no compartas tus credenciales.</div>
              <div style="margin-top:8px">Gracias por usar BlockVault.</div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
    }
  }

  async sendLoginNotificationEmail(toEmail: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Notificación de Inicio de sesión',
      html: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #003366; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .header { background-color: #0E1BCE; color: #ffffff; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 20px; background-color: #f4f4f4; border-radius: 8px; }
                .content p { line-height: 1.6; }
                .important { font-size: 20px; font-weight: bold; color: #ff5722; text-align: center; margin: 20px 0; }
                .security-tips { padding: 15px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin: 20px 0; }
                .security-tips h4 { font-size: 22px; color: #0E1BCE; margin: 0 0 10px; }
                .security-tips ul { padding-left: 20px; }
                .security-tips li { font-size: 18px; margin: 5px 0; }
                .footer { text-align: center; padding: 15px; font-size: 14px; color: #888; border-top: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                  <h1>BlockVault</h1>
                </div>
                <div class="content">
                    <p>Hola,</p>
                    <p>Hemos registrado un inicio de sesión en tu cuenta.</p>
                    <p>Si no reconoces esta actividad, por favor, contacta con nuestro soporte.</p>
                    <div class="important">IMPORTANTE: Protege tu cuenta</div>
                    <div class="security-tips">
                        <h4>Consejos para proteger tus fondos:</h4>
                        <ul>
                            <li>Utiliza contraseñas fuertes y únicas para tu cuenta.</li>
                            <li>Activa la autenticación de dos factores (2FA) siempre que sea posible.</li>
                            <li>No compartas tus claves privadas ni contraseñas con nadie.</li>
                            <li>Revisa regularmente tus transacciones y saldos.</li>
                            <li>Desconfía de enlaces y correos electrónicos sospechosos.</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                  <p>Gracias por usar BlockVault.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  }
}