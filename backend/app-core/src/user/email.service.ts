import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';


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

  async sendTokenLogin(toEmail: string, token: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Verification token to log in',
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
                    <h1>BrivoTrust</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Enter the following data to confirm your identity:</p>

                    <div class="token">
                     <span>TOKEN:</span> <strong>${token}</strong>
                    </div>

                    <p class="important">Token will expire in 5 minutes.</p>
                    <div class="security-tips">
                        <h4>Tips to protect your funds:</h4>
                        <ul>
                            <li>Use strong and unique passwords for your account.</li>
                            <li>Enable two-factor authentication (2FA) whenever possible.</li>
                            <li>Do not share your private keys or passwords with anyone.</li>
                            <li>Regularly review your transactions and balances.</li>
                            <li>Be wary of suspicious links and emails.</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>If you have any questions, do not hesitate to contact us.</p>
                    <p>Thank you for using BrivoTrust.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
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
      subject: 'Verify your email',
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
              <h1>BrivoTrust</h1>
            </div>
            <div class="content">
              <p class="lead">Hello,</p>
              <p>Please verify your email by clicking the button below to activate your account.</p>

              <p style="text-align:center; margin:24px 0"> 
                <a class="button" href="${verificationUrl}">Verify email</a>
              </p>

              <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
              <p class="muted"><a href="${verificationUrl}">${verificationUrl}</a></p>

              <p class="muted">This link will expire in 60 minutes. If you did not request this verification, ignore this email.</p>
            </div>
              <div class="footer">
              <div>Tips to protect your account: use 2FA and do not share your credentials.</div>
              <div style="margin-top:8px">Thank you for using BrivoTrust.</div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.FRONTEND_URL}/reset-password?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: email,
      subject: 'Reset your password',
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
              <h1>BrivoTrust</h1>
            </div>
            <div class="content">
              <p class="lead">Hello,</p>
              <p>You have requested to reset your password. Click the button below to create a new password.</p>

              <p style="text-align:center; margin:24px 0"> 
                <a class="button" href="${resetUrl}">Reset password</a>
              </p>

              <p class="muted">If the button does not work, copy and paste this link into your browser:</p>
              <p class="muted"><a href="${resetUrl}">${resetUrl}</a></p>

              <p class="muted">This link will expire in 60 minutes. If you did not request this reset, ignore this email.</p>
            </div>
            <div class="footer">
              <div>Tips to protect your account: use 2FA and do not share your credentials.</div>
              <div style="margin-top:8px">Thank you for using BrivoTrust.</div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }

  async sendLoginNotificationEmail(toEmail: string): Promise<void> {
    const mailOptions = {
      from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Login notification',
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
                  <h1>BrivoTrust</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We have recorded a login to your account.</p>
                    <p>If you do not recognize this activity, please contact our support.</p>
                    <div class="important">IMPORTANT: Protect your account</div>
                    <div class="security-tips">
                        <h4>Tips to protect your funds:</h4>
                        <ul>
                            <li>Use strong and unique passwords for your account.</li>
                            <li>Enable two-factor authentication (2FA) whenever possible.</li>
                            <li>Do not share your private keys or passwords with anyone.</li>
                            <li>Regularly review your transactions and balances.</li>
                            <li>Be wary of suspicious links and emails.</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                  <p>If you have any questions, do not hesitate to contact us.</p>
                  <p>Thank you for using BrivoTrust.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}