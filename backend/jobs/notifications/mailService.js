const nodemailer = require('nodemailer')

const mailService = process.env.SERVICE || 'gmail'
const mailUser = process.env.USER
const mailPass = process.env.PASS
const mailFrom = process.env.EMAIL_FROM || process.env.MAIL_FROM || `BrivoTrust <${mailUser}>`
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

const GRADIENT = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)'

const LOGO_SVG = `
  <div style="text-align:center; margin-bottom:16px">
    <svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366F1"/>
          <stop offset="50%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#2186EB"/>
        </linearGradient>
      </defs>
      <polygon points="28,2 52,16 52,40 28,54 4,40 4,16" fill="url(#g)"/>
      <text x="28" y="34" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="Arial,sans-serif">B</text>
    </svg>
  </div>
`

const HEADER_STYLE = `background:${GRADIENT};color:#fff;padding:20px 18px;text-align:center;border-radius:10px 10px 0 0`

const STYLE = `
  body{font-family:Arial,sans-serif;color:#E5E7EB;margin:0;padding:0;background-color:#0F0F1A}
  .container{max-width:600px;margin:20px auto;background:#1A1A2E;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.4)}
  .content{padding:24px}
  .content p{line-height:1.6;color:#D1D5DB}
  .success{color:#4CAF50;font-weight:700;font-size:18px;margin:0 0 8px}
  .info{color:#9CA3AF;font-size:14px}
  a{color:#6366F1;text-decoration:none}
  .tip-box{background:#0F0F1A;border-left:3px solid #6366F1;border-radius:4px;padding:12px 16px;margin:20px 0}
  .tip-box h4{margin:0 0 8px;color:#A5B4FC;font-size:15px}
  .tip-box ul{margin:0;padding-left:18px;color:#9CA3AF;font-size:13px}
  .tip-box li{margin:4px 0}
  .footer{background:#12121E;padding:16px;text-align:center;font-size:13px;color:#6B7280}
`

const TIPS = `
  <div class="tip-box">
    <h4>Consejos para proteger tus fondos:</h4>
    <ul>
      <li>Utiliza contraseñas fuertes y únicas para tu cuenta.</li>
      <li>Activa la autenticación de dos factores (2FA) siempre que sea posible.</li>
      <li>No compartas tus claves privadas ni contraseñas con nadie.</li>
      <li>Revisa regularmente tus transacciones y saldos.</li>
      <li>Desconfía de enlaces y correos electrónicos sospechosos.</li>
    </ul>
  </div>
`

const FOOTER = `
  <div class="footer">
    <p style="margin:4px 0">Gracias por usar <span style="color:#8B5CF6">BrivoTrust</span>.</p>
    <p style="margin:4px 0">Si tienes alguna pregunta, no dudes en contactarnos.</p>
  </div>
`

function wrapHtml(bodyContent) {
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
          <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.5px">BrivoTrust</h1>
        </div>
        <div class="content">${bodyContent}</div>
        ${FOOTER}
      </div>
    </body>
    </html>
  `
}

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
        subject: `[BrivoTrust] Confirmación de Depósito`,
        html: wrapHtml(`
            <p class="success">Depósito completado correctamente</p>
            <p>Tu depósito de <strong>${amount} ${coin.toUpperCase()}</strong> 
            ya está disponible en tu cuenta de BrivoTrust.</p>
            <p style="text-align:center;margin:24px 0">
                <a href="${frontendUrl}/wallet/${coin.toLowerCase()}"
                 target="_blank" rel="noopener"
                 style="display:inline-block;background:${GRADIENT};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                 Comprueba tu balance aquí
                </a>
            </p>
            ${TIPS}
        `)
    }

    return await sendMailSafe(mailDetails)
}

const sendWithdrawEmail = async (amount, coin, toAddress, txId, toEmail) => {
    const mailDetails = {
        from: mailFrom,
        to: toEmail,
        subject: `[BrivoTrust] Confirmación de Retiro`,
        html: wrapHtml(`
            <p class="success">Retiro completado correctamente</p>
            <p>Has realizado una retirada de <strong>${amount} ${coin.toUpperCase()}</strong> 
            en tu cuenta de BrivoTrust.</p>
            <div style="background:#0F0F1A;border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:4px 0;color:#9CA3AF"><strong style="color:#D1D5DB">Dirección de retiro:</strong> ${toAddress}</p>
                <p style="margin:4px 0;color:#9CA3AF"><strong style="color:#D1D5DB">ID de Transacción:</strong> ${txId}</p>
            </div>
            ${TIPS}
        `)
    }

    return await sendMailSafe(mailDetails)
}

module.exports = {
    sendDepositEmail,
    sendWithdrawEmail
}
