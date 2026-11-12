const TWILIO_API = 'https://verify.twilio.com/v2/Services';

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function validPhone(value) {
  return typeof value === 'string' && /^\+91[6-9]\d{9}$/.test(value.trim());
}

function credentials() {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    TWILIO_VERIFY_SERVICE_SID,
  } = process.env;
  const hasApiKeyConfig = Boolean(TWILIO_API_KEY_SID || TWILIO_API_KEY_SECRET);
  const username = hasApiKeyConfig ? TWILIO_API_KEY_SID : TWILIO_ACCOUNT_SID;
  const password = hasApiKeyConfig ? TWILIO_API_KEY_SECRET : TWILIO_AUTH_TOKEN;
  if (!username || !password || !TWILIO_VERIFY_SERVICE_SID) return null;
  return { username, password, TWILIO_VERIFY_SERVICE_SID };
}

async function callTwilio(path, service, username, password, values) {
  const response = await fetch(`${TWILIO_API}/${encodeURIComponent(service)}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(values),
  });
  const result = await response.json().catch(() => ({}));
  return { response, result };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST for this endpoint.' });
  }

  const config = credentials();
  if (!config) {
    return json(res, 503, { error: 'SMS verification is not configured on this deployment.' });
  }

  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  if (!validPhone(phone)) {
    return json(res, 400, { error: 'Enter a valid Indian mobile number with country code.' });
  }

  try {
    if (action === 'send-otp') {
      const { response } = await callTwilio(
        'Verifications',
        config.TWILIO_VERIFY_SERVICE_SID,
        config.username,
        config.password,
        { To: phone, Channel: 'sms' },
      );
      if (!response.ok) return json(res, response.status === 429 ? 429 : 502, { error: 'Could not send SMS verification code.' });
      return json(res, 200, { sent: true });
    }

    if (action === 'verify-otp') {
      const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\D/g, '') : '';
      if (!/^\d{6}$/.test(code)) return json(res, 400, { error: 'Enter the 6-digit code from the SMS.' });
      const { response, result } = await callTwilio(
        'VerificationCheck',
        config.TWILIO_VERIFY_SERVICE_SID,
        config.username,
        config.password,
        { To: phone, Code: code },
      );
      if (response.ok) return json(res, 200, { valid: result.status === 'approved' });
      if (response.status === 400 || response.status === 404) return json(res, 200, { valid: false });
      return json(res, response.status === 429 ? 429 : 502, { error: 'Could not verify the SMS code.' });
    }

    return json(res, 404, { error: 'Unknown authentication action.' });
  } catch {
    return json(res, 502, { error: 'SMS verification service is unavailable. Please try again.' });
  }
}
