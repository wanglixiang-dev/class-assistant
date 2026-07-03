export function createEmailService(config) {
  async function sendEmail({ to, subject, text }) {
    if (config.resendApiKey) {
      await sendViaResend(config, { to, subject, text });
      return;
    }

    console.info(`[mail:console] to=${to} subject=${subject}\n${text}`);
  }

  return { sendEmail };
}

async function sendViaResend(config, message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`邮件发送失败：${response.status} ${detail}`);
  }
}
