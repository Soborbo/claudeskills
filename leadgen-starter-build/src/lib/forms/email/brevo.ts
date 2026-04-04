/**
 * Brevo (Sendinblue) email provider — fallback
 */

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendViaBrevo(
  apiKey: string,
  params: SendEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: params.from },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        replyTo: params.replyTo ? { email: params.replyTo } : undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Brevo ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
