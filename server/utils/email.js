const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendPinResetEmail({ to, shopName, resetUrl }) {
  const year = new Date().getFullYear()
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">

    <div style="background:#dc2626;padding:36px 40px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:rgba(255,255,255,.18);border-radius:50%;margin-bottom:14px">
        <span style="font-size:30px;line-height:1">🔑</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.4px">Reset Your PIN</h1>
      <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;letter-spacing:.5px;text-transform:uppercase">${shopName}</p>
    </div>

    <div style="padding:36px 40px 28px">
      <p style="margin:0 0 14px;color:#1e293b;font-size:15px;line-height:1.65">
        Hello! We received a request to reset the PIN for your <strong>Blessed Auto Spares</strong> account.
        Click the button below — this link expires in <strong style="color:#dc2626">15 minutes</strong>.
      </p>
      <p style="margin:0 0 28px;color:#64748b;font-size:13px;line-height:1.6">
        If you did not request this, you can safely ignore this email. Your PIN remains unchanged.
      </p>
      <div style="text-align:center;margin-bottom:28px">
        <a href="${resetUrl}"
           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                  padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;
                  letter-spacing:.3px;box-shadow:0 4px 12px rgba(220,38,38,.35)">
          Reset My PIN &rarr;
        </a>
      </div>
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6">
        Or paste this link in your browser:<br>
        <a href="${resetUrl}" style="color:#dc2626;word-break:break-all;font-size:11px">${resetUrl}</a>
      </p>
    </div>

    <div style="background:#f8fafc;padding:18px 40px;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6">
        &copy; ${year} Blessed Auto Spares &bull; Powered by Dominion Softwares<br>
        This is an automated message &mdash; please do not reply.
      </p>
    </div>

  </div>
</body>
</html>`

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || `"Blessed Auto Spares" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your Blessed Auto Spares PIN',
    html,
  })
}

module.exports = { sendPinResetEmail }
