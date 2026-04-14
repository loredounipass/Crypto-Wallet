const nodemailer = require('nodemailer')

const mailService = process.env.SERVICE || 'gmail'
const mailUser = process.env.USER
const mailPass = process.env.PASS
const mailFrom = process.env.EMAIL_FROM || process.env.MAIL_FROM || `BlokVault <${mailUser}>`
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

let mailTransporter = null
if (mailUser && mailPass) {
    mailTransporter = nodemailer.createTransport({
        service: mailService,
        auth: {
            user: mailUser,
            pass: mailPass
        }
    })
}

const sendMailSafe = async (mailDetails) => {
    if (!mailTransporter) {
        console.warn('[MAIL] transporter not configured: missing SERVICE/USER/PASS credentials')
        return null
    }

    try {
        return await mailTransporter.sendMail(mailDetails)
    } catch (error) {
        console.error('[MAIL] send failed', error?.message || error)
        return null
    }
}

const sendDepositEmail = async (amount, coin, toEmail) => {
    const mailDetails = {
        from: mailFrom,
        to: toEmail,
        subject: `[BlokVault] Confirmación de Depósito`,
        html: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f0f4f8; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; }
                .header { background-color: #1E90FF; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 24px; }
                h3 { color: #4CAF50; }
                p { line-height: 1.6; }
                a { color: #1E90FF; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .security-tips { margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-left: 5px solid #1E90FF; border-radius: 4px; }
                .security-tips h4 { margin-top: 0; color: #333; }
                .security-tips ul { margin: 0; padding: 0; list-style-type: disc; }
                .security-tips ul li { margin: 5px 0; }
                .footer { margin-top: 20px; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BlokVault</h1>
                </div>
                <h3><strong>Depósito completado correctamente</strong></h3>
                <p>Tu depósito de <strong>${amount} ${coin.toUpperCase()}</strong> 
                ya está disponible en tu cuenta de BlokVault. 
                <a href="${frontendUrl}/wallet/${coin.toLowerCase()}"
                 target="_blank" rel="noopener">Comprueba tu balance aquí.</a></p>
                
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

                <div class="footer">
                    <p>Gracias por usar BlokVault. Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
            </div>
        </body>
        </html>`
    }

    return await sendMailSafe(mailDetails)
}

const sendWithdrawEmail = async (amount, coin, toAddress, txId, toEmail) => {
    const mailDetails = {
        from: mailFrom,
        to: toEmail,
        subject: `[BlokVault] Confirmación de Retiro`,
        html: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f0f4f8; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; }
                .header { background-color: #FF5722; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 24px; }
                h3 { color: #FF5722; }
                div { line-height: 1.6; }
                strong { color: #333; }
                .security-tips { margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-left: 5px solid #FF5722; border-radius: 4px; }
                .security-tips h4 { margin-top: 0; color: #333; }
                .security-tips ul { margin: 0; padding: 0; list-style-type: disc; }
                .security-tips ul li { margin: 5px 0; }
                .footer { margin-top: 20px; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BlokVault</h1>
                </div>
                <h3><strong>Retiro completado correctamente</strong></h3>
                <div>Has realizado una retirada de <strong>${amount} ${coin.toUpperCase()}</strong> 
                en tu cuenta de BlokVault.</div>
                <div>&nbsp;</div>
                <div><strong>Dirección de retiro:</strong> ${toAddress}</div>
                <div><strong>ID de Transacción:</strong> ${txId}</div>

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

                <div class="footer">
                    <p>Gracias por usar BlokVault. Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
            </div>
        </body>
        </html>`
    }

    return await sendMailSafe(mailDetails)
}

module.exports = {
    sendDepositEmail,
    sendWithdrawEmail
}
