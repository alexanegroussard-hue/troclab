const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMessageNotification({ toEmail, toName, fromName, fromOrg, messageBody }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: 'TrocLab <onboarding@resend.dev>',
      to: toEmail,
      subject: `${fromName} vous a envoyé un message sur TrocLab`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1B3A6B">Nouveau message sur TrocLab</h2>
          <p><strong>${fromName}</strong> (${fromOrg}) vous a envoyé un message :</p>
          <div style="background:#f4f7fb;border-radius:8px;padding:16px;margin:16px 0;font-style:italic">
            "${messageBody.substring(0, 300)}${messageBody.length > 300 ? '…' : ''}"
          </div>
          <a href="https://troclab-1.onrender.com/messages" 
             style="background:#E87722;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            Répondre sur TrocLab
          </a>
          <p style="color:#888;font-size:0.8rem;margin-top:24px">
            Vous recevez cet email car vous avez activé les notifications sur TrocLab.<br>
            Pour les désactiver, rendez-vous dans Mon espace → Mon profil.
          </p>
        </div>
      `
    });
  } catch (err) {
    console.error('Resend error:', err.message);
  }
}

module.exports = { sendMessageNotification };
