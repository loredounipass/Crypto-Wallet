import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';

const GRADIENT = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)';

const LOGO_SVG = `
  <div style="text-align:center; margin-bottom:16px">
    <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366F1"/>
          <stop offset="50%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#2186EB"/>
        </linearGradient>
      </defs>
      <polygon points="28,2 52,16 52,40 28,54 4,40 4,16" fill="url(#logoGrad)"/>
      <text x="28" y="34" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="Arial,sans-serif">B</text>
    </svg>
  </div>
`;

const HEADER_STYLE = `
  background:${GRADIENT};
  color:#ffffff;
  padding:24px 18px;
  text-align:center;
  border-radius:10px 10px 0 0;
`;

const STYLE = `
  body{font-family:Arial,sans-serif;color:#E5E7EB;margin:0;padding:0;background-color:#0F0F1A}
  .container{max-width:600px;margin:20px auto;background:#1A1A2E;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.4)}
  .content{padding:24px}
  .lead{font-size:16px;margin-bottom:18px;color:#D1D5DB}
  .button{display:inline-block;background:${GRADIENT};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600}
  .muted{color:#9CA3AF;font-size:14px;margin-top:16px}
  .divider{height:1px;background:rgba(99,102,241,0.2);margin:20px 0}
  .footer{background:#12121E;padding:16px;text-align:center;font-size:13px;color:#6B7280}
  .highlight{color:#A5B4FC;font-weight:600}
  .token-box{background:#0F0F1A;border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:16px;text-align:center;margin:16px 0}
  .token-box code{font-size:32px;font-weight:bold;color:#8B5CF6;letter-spacing:4px}
  .tip-box{background:#0F0F1A;border-left:3px solid #6366F1;border-radius:4px;padding:12px 16px;margin:16px 0}
  .tip-box h4{margin:0 0 8px;color:#A5B4FC;font-size:15px}
  .tip-box ul{margin:0;padding-left:18px;color:#9CA3AF;font-size:13px}
  .tip-box li{margin:4px 0}
`;

const TIPS_HTML = `
  <div class="tip-box">
    <h4>Tips to protect your funds:</h4>
    <ul>
      <li>Use strong and unique passwords for your account.</li>
      <li>Enable two-factor authentication (2FA) whenever possible.</li>
      <li>Do not share your private keys or passwords with anyone.</li>
      <li>Regularly review your transactions and balances.</li>
      <li>Be wary of suspicious links and emails.</li>
    </ul>
  </div>
`;

const FOOTER_HTML = `
  <div class="footer">
    <p style="margin:4px 0">If you have any questions, do not hesitate to contact us.</p>
    <p style="margin:4px 0">Thank you for using <span style="color:#8B5CF6">BrivoTrust</span>.</p>
  </div>
`;

function wrapHtml(title, bodyContent) {
  return `
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>${STYLE}</style>
    </head>
    <body>
      <div class="container">
        <div style="${HEADER_STYLE}">
          ${LOGO_SVG}
          <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px">BrivoTrust</h1>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        ${FOOTER_HTML}
      </div>
    </body>
    </html>
  `;
}

@Injectable()
export class EmailService {
  private readonly FROM_NAME = 'BrivoTrust';
  private readonly FROM_EMAIL = 'noreply@brivotrust.com';
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



  // ENVIA UN CORREO CON UN TOKEN NUMERICO NECESARIO PARA VERIFICAR LA IDENTIDAD DURANTE EL INICIO DE SESION
  async sendTokenLogin(toEmail: string, token: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Verification token to log in',
      html: wrapHtml('Verification', `
        <p class="lead">Hello,</p>
        <p style="color:#D1D5DB">Enter the following data to confirm your identity:</p>
        <div class="token-box">
          <code>${token}</code>
        </div>
        <p class="muted" style="color:#EF4444;font-weight:600">Token will expire in 5 minutes.</p>
        <div class="divider"></div>
        ${TIPS_HTML}
      `),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }



  // GENERA DE MANERA ALEATORIA Y SEGURA UN CODIGO NUMERICO DE SEIS DIGITOS PARA LA AUTENTICACION
  async generateToken(): Promise<string> {
    const num = randomInt(0, 1000000);
    await Promise.resolve();
    return String(num).padStart(6, '0');
  }



  // ENVIA UN ENLACE DE CONFIRMACION AL CORREO DEL USUARIO PARA ACTIVAR Y VALIDAR SU CUENTA RECIEN CREADA
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.FRONTEND_URL}/verifyemail?token=${encodeURIComponent(token)}`;
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: email,
      subject: 'Verify your email',
      html: wrapHtml('Verify Email', `
        <p class="lead">Hello,</p>
        <p style="color:#D1D5DB">Please verify your email by clicking the button below to activate your account.</p>
        <p style="text-align:center;margin:24px 0">
          <a class="button" href="${verificationUrl}">Verify email</a>
        </p>
        <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
        <p class="muted" style="word-break:break-all"><a href="${verificationUrl}" style="color:#6366F1">${verificationUrl}</a></p>
        <p class="muted">This link will expire in 60 minutes. If you did not request this verification, ignore this email.</p>
        <div class="divider"></div>
        <p style="color:#9CA3AF;font-size:13px">Tips to protect your account: use 2FA and do not share your credentials.</p>
      `),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }



  // ENVIA AL USUARIO UN ENLACE DE RECUPERACION CON UN TOKEN UNICO PARA QUE PUEDA RESTABLECER SU CONTRASENA
  async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.FRONTEND_URL}/reset-password?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: email,
      subject: 'Reset your password',
      html: wrapHtml('Reset Password', `
        <p class="lead">Hello,</p>
        <p style="color:#D1D5DB">You have requested to reset your password. Click the button below to create a new password.</p>
        <p style="text-align:center;margin:24px 0">
          <a class="button" href="${resetUrl}">Reset password</a>
        </p>
        <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
        <p class="muted" style="word-break:break-all"><a href="${resetUrl}" style="color:#6366F1">${resetUrl}</a></p>
        <p class="muted">This link will expire in 60 minutes. If you did not request this reset, ignore this email.</p>
        <div class="divider"></div>
        <p style="color:#9CA3AF;font-size:13px">Tips to protect your account: use 2FA and do not share your credentials.</p>
      `),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }



  // NOTIFICA AL USUARIO INMEDIATAMENTE VIA CORREO ELECTRONICO CUANDO SE DETECTA UN INICIO DE SESION EXITOSO
  async sendLoginNotificationEmail(toEmail: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Login notification',
      html: wrapHtml('Login Alert', `
        <p class="lead">Hello,</p>
        <p style="color:#D1D5DB">We have recorded a login to your account.</p>
        <p style="color:#9CA3AF;font-size:14px">If you do not recognize this activity, please contact our support.</p>
        <div class="token-box">
          <span style="color:#EF4444;font-weight:700;font-size:16px">IMPORTANT: Protect your account</span>
        </div>
        <div class="divider"></div>
        ${TIPS_HTML}
      `),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
