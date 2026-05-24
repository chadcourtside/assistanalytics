export async function sendEmail(env, { to, subject, html, text }) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM || 'Assist Analytics <onboarding@resend.dev>';

  if (!apiKey) {
    console.log('[email:dev]', { to, subject, text });
    return { ok: true, dev: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Email send failed', response.status, body);
    return { ok: false, error: 'Could not send email' };
  }

  return { ok: true };
}

export function getAppBaseUrl(request, env) {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return 'http://localhost:5173';
  }
}
