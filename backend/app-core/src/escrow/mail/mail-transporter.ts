import * as nodemailer from 'nodemailer';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const mailUser     = process.env.EMAIL_USER;
const mailPass     = process.env.EMAIL_PASS;
const mailFrom     = process.env.EMAIL_FROM || `BrivoTrust <${mailUser}>`;
const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:3000';

const GRADIENT     = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)';
const HEADER_STYLE = `background:${GRADIENT};color:#fff;padding:20px 18px;text-align:center;border-radius:10px 10px 0 0`;

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
`;

const LOGO_SVG = `
  <div style="text-align:center; margin-bottom:16px">
    <svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366F1"/>
        <stop offset="50%" stop-color="#8B5CF6"/>
        <stop offset="100%" stop-color="#2186EB"/>
      </linearGradient></defs>
      <polygon points="28,2 52,16 52,40 28,54 4,40 4,16" fill="url(#g)"/>
      <text x="28" y="34" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="Arial,sans-serif">B</text>
    </svg>
  </div>
`;

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
`;

const FOOTER = `
  <div class="footer">
    <p style="margin:4px 0">Gracias por usar <span style="color:#8B5CF6">BrivoTrust</span>.</p>
    <p style="margin:4px 0">Si tienes alguna pregunta, no dudes en contactarnos.</p>
  </div>
`;

// ─── TRANSPORTER ─────────────────────────────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  if (!mailUser || !mailPass) return null;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mailUser, pass: mailPass },
  });
  return _transporter;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function wrapHtml(body: string): string {
  return `
    <html><head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>${STYLE}</style>
    </head><body>
      <div class="container">
        <div style="${HEADER_STYLE}">
          ${LOGO_SVG}
          <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.5px">BrivoTrust</h1>
        </div>
        <div class="content">${body}</div>
        ${FOOTER}
      </div>
    </body></html>
  `;
}

function truncAddr(addr?: string): string {
  return addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '—';
}

function formatDate(d?: string | Date): string {
  return d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' } as any) : '—';
}

function buildOrderTable(o: Record<string, any>): string {
  return `
    <div style="background:#0F0F1A;border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:16px;margin:16px 0;font-size:14px">
      <table style="width:100%;border-collapse:collapse;color:#D1D5DB">
        <tr><td style="padding:5px 0;color:#9CA3AF;width:45%">ID de Orden</td>
            <td style="padding:5px 0;font-family:monospace;font-size:12px;color:#A5B4FC">${o.orderId || '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#9CA3AF">Moneda</td>
            <td style="padding:5px 0;font-weight:700;color:#F9FAFB">${(o.coin || '').toUpperCase()}</td></tr>
        <tr><td style="padding:5px 0;color:#9CA3AF">Monto Cripto</td>
            <td style="padding:5px 0;font-weight:700;color:#F9FAFB">${o.amount} ${(o.coin || '').toUpperCase()}</td></tr>
        <tr><td style="padding:5px 0;color:#9CA3AF">Monto Fiat</td>
            <td style="padding:5px 0;font-weight:700;color:#4ADE80">${o.fiatAmount ? `$${o.fiatAmount}` : '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#9CA3AF">Método de Pago</td>
            <td style="padding:5px 0">${o.paymentMethod || '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#9CA3AF">Dirección Vendedor</td>
            <td style="padding:5px 0;font-family:monospace;font-size:12px">${truncAddr(o.sellerWalletAddress)}</td></tr>
        ${o.expiresAt ? `<tr><td style="padding:5px 0;color:#9CA3AF">Expira</td>
            <td style="padding:5px 0;color:#FBBF24">${formatDate(o.expiresAt)}</td></tr>` : ''}
      </table>
    </div>
  `;
}

function buildChatroomCTA(chatroomId?: string, label = 'Ir al Chat de la Orden'): string {
  if (!chatroomId) return '';
  return `
    <p style="text-align:center;margin:24px 0">
      <a href="${frontendUrl}/p2p/chat/${chatroomId}" target="_blank" rel="noopener"
         style="display:inline-block;background:${GRADIENT};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        ${label}
      </a>
    </p>
  `;
}

// ─── SEND HELPER ─────────────────────────────────────────────────────────────
export async function sendMailSafe(opts: nodemailer.SendMailOptions): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn('[EscrowMail] Transporter not configured — missing EMAIL_USER/EMAIL_PASS');
    return;
  }
  try {
    await t.sendMail({ from: mailFrom, ...opts });
  } catch (err: any) {
    console.error('[EscrowMail] sendMail failed:', err?.message ?? err);
  }
}

// ─── P2P EMAIL FUNCTIONS ─────────────────────────────────────────────────────

export async function sendP2POrderCreatedEmail(
  o: Record<string, any>, toEmail: string, recipientType: 'seller' | 'provider' = 'seller',
): Promise<void> {
  const isSeller = recipientType === 'seller';
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Nueva Orden P2P creada · ${(o.coin || '').toUpperCase()} ${o.amount}`,
    html: wrapHtml(`
      <p class="success">📋 Orden P2P ${isSeller ? 'Creada' : 'Recibida'}</p>
      <p>${isSeller
        ? '<strong>Has creado</strong> una nueva orden P2P. Los fondos están siendo enviados al escrow.'
        : '<strong>Has recibido</strong> una nueva solicitud de orden P2P. Un usuario quiere intercambiar cripto contigo.'
      }</p>
      ${buildOrderTable(o)}
      ${buildChatroomCTA(o.chatroomId)}
      ${TIPS}
    `),
  });
}

export async function sendP2POrderFundedEmail(o: Record<string, any>, toEmail: string): Promise<void> {
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Fondos en Escrow · Orden ${(o.orderId as string)?.slice(0, 8)}`,
    html: wrapHtml(`
      <p class="success">🔒 Fondos Bloqueados en Escrow</p>
      <p>Los fondos de la orden P2P están <strong>bloqueados de forma segura</strong> en el contrato escrow.
      El intercambio puede proceder.</p>
      ${buildOrderTable(o)}
      ${buildChatroomCTA(o.chatroomId, 'Coordinar en el Chat')}
      ${TIPS}
    `),
  });
}

export async function sendP2PPaymentConfirmedEmail(o: Record<string, any>, toEmail: string): Promise<void> {
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Pago Fiat Confirmado · Orden ${(o.orderId as string)?.slice(0, 8)}`,
    html: wrapHtml(`
      <p class="success">✅ Pago Fiat Confirmado</p>
      <p>El proveedor ha confirmado que <strong>recibió el pago</strong> en su cuenta.
      Ahora puedes liberar los fondos del escrow para completar el intercambio.</p>
      ${buildOrderTable(o)}
      <div class="tip-box">
        <h4>⚡ Siguiente paso</h4>
        <ul>
          <li>Verifica que recibiste el pago fiat en tu cuenta.</li>
          <li>Una vez confirmado, libera los fondos desde el chat de la orden.</li>
          <li>Si hay algún problema, puedes abrir una disputa.</li>
        </ul>
      </div>
      ${buildChatroomCTA(o.chatroomId, 'Liberar Fondos')}
    `),
  });
}

export async function sendP2PFundsReleasedEmail(o: Record<string, any>, toEmail: string): Promise<void> {
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Fondos Liberados · ${(o.coin || '').toUpperCase()} ${o.amount}`,
    html: wrapHtml(`
      <p class="success">🚀 Fondos en Camino</p>
      <p>El vendedor ha <strong>liberado los fondos</strong> del escrow.
      Los <strong>${o.amount} ${(o.coin || '').toUpperCase()}</strong> están siendo transferidos a tu wallet.</p>
      ${buildOrderTable(o)}
      <p class="info">La transacción puede tardar unos minutos en confirmarse en la blockchain.</p>
      ${buildChatroomCTA(o.chatroomId, 'Ver Detalles')}
    `),
  });
}

export async function sendP2POrderCompletedEmail(
  o: Record<string, any>, toEmail: string, recipientType: 'seller' | 'provider' = 'seller',
): Promise<void> {
  const isSeller = recipientType === 'seller';
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] ¡Orden P2P Completada! · ${(o.coin || '').toUpperCase()} ${o.amount}`,
    html: wrapHtml(`
      <p class="success">🎉 ¡Intercambio Completado!</p>
      <p>${isSeller
        ? 'Tu orden P2P fue completada exitosamente. Los fondos han sido transferidos al proveedor.'
        : 'La orden P2P fue completada. Los fondos han llegado a tu wallet.'
      }</p>
      ${buildOrderTable(o)}
      <p style="text-align:center;margin:24px 0">
        <a href="${frontendUrl}/p2p" target="_blank" rel="noopener"
           style="display:inline-block;background:${GRADIENT};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Crear Nueva Orden
        </a>
      </p>
    `),
  });
}

export async function sendP2POrderCancelledEmail(
  o: Record<string, any>, toEmail: string, recipientType: 'seller' | 'provider' = 'seller',
): Promise<void> {
  const isSeller = recipientType === 'seller';
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Orden P2P Cancelada · ${(o.orderId as string)?.slice(0, 8)}`,
    html: wrapHtml(`
      <p style="color:#F87171;font-weight:700;font-size:18px;margin:0 0 8px">❌ Orden Cancelada</p>
      <p>${isSeller
        ? 'Has cancelado la orden P2P. Los fondos serán <strong>devueltos a tu wallet</strong> en breve.'
        : 'El vendedor ha cancelado la orden P2P. El intercambio no se realizará.'
      }</p>
      ${buildOrderTable(o)}
      ${TIPS}
    `),
  });
}

export async function sendP2POrderExpiredEmail(o: Record<string, any>, toEmail: string): Promise<void> {
  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] Orden P2P Expirada · ${(o.orderId as string)?.slice(0, 8)}`,
    html: wrapHtml(`
      <p style="color:#FBBF24;font-weight:700;font-size:18px;margin:0 0 8px">⏰ Orden Expirada</p>
      <p>Tu orden P2P ha <strong>expirado</strong> por inactividad. Los fondos están siendo
      <strong>reembolsados automáticamente</strong> a tu wallet.</p>
      ${buildOrderTable(o)}
      <div class="tip-box">
        <h4>¿Qué pasó?</h4>
        <ul>
          <li>Las órdenes P2P tienen un tiempo límite de actividad.</li>
          <li>Si el proveedor no respondió a tiempo, puedes crear una nueva orden.</li>
          <li>Tu reembolso aparecerá en tu balance en breve.</li>
        </ul>
      </div>
      <p style="text-align:center;margin:24px 0">
        <a href="${frontendUrl}/p2p" target="_blank" rel="noopener"
           style="display:inline-block;background:${GRADIENT};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Crear Nueva Orden
        </a>
      </p>
    `),
  });
}

export async function sendP2PDisputeOpenedEmail(
  o: Record<string, any>, toEmail: string, recipientType: 'seller' | 'provider' | 'admin' = 'seller',
): Promise<void> {
  const isAdmin  = recipientType === 'admin';
  const isSeller = recipientType === 'seller';
  const intro = isAdmin
    ? 'Se ha abierto una <strong>disputa</strong> en una orden P2P que requiere tu atención como administrador.'
    : isSeller
      ? 'Has abierto una disputa en tu orden P2P. El equipo de BrivoTrust la revisará y tomará una decisión.'
      : 'El vendedor ha abierto una <strong>disputa</strong> en esta orden P2P. El equipo de BrivoTrust la revisará.';

  await sendMailSafe({
    to: toEmail,
    subject: `[BrivoTrust] ${isAdmin ? '[ADMIN] ' : ''}Disputa Abierta · Orden ${(o.orderId as string)?.slice(0, 8)}`,
    html: wrapHtml(`
      <p style="color:#F59E0B;font-weight:700;font-size:18px;margin:0 0 8px">⚠️ Disputa Abierta</p>
      <p>${intro}</p>
      ${o.disputeReason ? `
      <div style="background:#0F0F1A;border-left:3px solid #F59E0B;border-radius:4px;padding:12px 16px;margin:16px 0">
        <p style="margin:0;color:#9CA3AF;font-size:13px"><strong style="color:#FCD34D">Motivo de la disputa:</strong></p>
        <p style="margin:8px 0 0;color:#D1D5DB">${o.disputeReason}</p>
      </div>` : ''}
      ${buildOrderTable(o)}
      ${isAdmin
        ? `<p style="text-align:center;margin:24px 0">
            <a href="${frontendUrl}/admin/disputes" target="_blank" rel="noopener"
               style="display:inline-block;background:${GRADIENT};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              Resolver Disputa
            </a>
           </p>`
        : buildChatroomCTA(o.chatroomId, 'Ver Chat de la Orden')
      }
      ${TIPS}
    `),
  });
}
