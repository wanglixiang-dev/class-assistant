import net from "node:net";
import tls from "node:tls";

export function createEmailService(config) {
  async function sendEmail({ to, subject, text }) {
    if (config.directMailUser && config.directMailPassword) {
      await sendViaDirectMail(config, { to, subject, text });
      return;
    }

    console.info(`[mail:console] to=${to} subject=${subject}\n${text}`);
  }

  return { sendEmail };
}

async function sendViaDirectMail(config, message) {
  const client = await createSmtpClient(config);
  const fromAddress = extractEmailAddress(config.mailFrom);

  try {
    await client.expect(220);
    await client.command(`EHLO ${config.directMailEhloDomain || "class-assistant.local"}`, 250);
    await client.command("AUTH LOGIN", 334);
    await client.command(Buffer.from(config.directMailUser).toString("base64"), 334);
    await client.command(Buffer.from(config.directMailPassword).toString("base64"), 235);
    await client.command(`MAIL FROM:<${fromAddress}>`, 250);
    await client.command(`RCPT TO:<${message.to}>`, [250, 251]);
    await client.command("DATA", 354);
    await client.command(formatMimeMessage(config.mailFrom, message), 250);
    await client.command("QUIT", 221);
  } finally {
    client.close();
  }
}

function createSmtpClient(config) {
  const socket = config.directMailSecure
    ? tls.connect({
        host: config.directMailHost,
        port: config.directMailPort,
        servername: config.directMailHost,
      })
    : net.connect({
        host: config.directMailHost,
        port: config.directMailPort,
      });

  socket.setEncoding("utf8");
  socket.setTimeout(15000);

  let buffer = "";
  const pending = [];

  socket.on("data", (chunk) => {
    buffer += chunk;
    drainReplies();
  });

  socket.on("error", (error) => {
    while (pending.length) {
      pending.shift().reject(error);
    }
  });

  socket.on("timeout", () => {
    const error = new Error("邮件发送失败：SMTP 连接超时");
    socket.destroy(error);
    while (pending.length) {
      pending.shift().reject(error);
    }
  });

  function drainReplies() {
    while (pending.length) {
      const reply = readReply();
      if (!reply) return;
      pending.shift().resolve(reply);
    }
  }

  function readReply() {
    const lines = buffer.split("\r\n");
    let consumed = 0;
    let replyLines = [];

    for (const line of lines) {
      if (!line) break;
      consumed += line.length + 2;
      replyLines.push(line);

      if (/^\d{3} /.test(line)) {
        buffer = buffer.slice(consumed);
        return replyLines.join("\n");
      }
    }

    return null;
  }

  function nextReply() {
    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      drainReplies();
    });
  }

  function close() {
    socket.end();
  }

  async function expect(expectedCodes) {
    const reply = await nextReply();
    assertSmtpReply(reply, expectedCodes);
    return reply;
  }

  async function command(commandText, expectedCodes) {
    socket.write(`${commandText}\r\n`);
    return expect(expectedCodes);
  }

  return { close, command, expect };
}

function assertSmtpReply(reply, expectedCodes) {
  const expected = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
  const code = Number(reply.slice(0, 3));

  if (!expected.includes(code)) {
    throw new Error(`邮件发送失败：SMTP 返回 ${reply}`);
  }
}

function formatMimeMessage(from, message) {
  const headers = [
    `From: ${formatAddressHeader(from)}`,
    `To: ${message.to}`,
    `Subject: ${encodeMimeHeader(message.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${cryptoRandomId()}@mail.wanglx.top>`,
  ];

  return `${headers.join("\r\n")}\r\n\r\n${escapeSmtpData(message.text)}\r\n.`;
}

function formatAddressHeader(value) {
  const match = String(value).match(/^(.*)<([^>]+)>$/);
  if (!match) return value;

  const name = match[1].trim();
  const address = match[2].trim();
  return name ? `${encodeMimeHeader(name)} <${address}>` : address;
}

function encodeMimeHeader(value) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;
}

function escapeSmtpData(value) {
  return String(value).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function extractEmailAddress(value) {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

function cryptoRandomId() {
  return `${Date.now()}.${Math.random().toString(36).slice(2)}`;
}
