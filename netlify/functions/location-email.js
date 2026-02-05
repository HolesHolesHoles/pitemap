exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_TO = process.env.EMAIL_TO;
    const EMAIL_FROM = process.env.EMAIL_FROM;

    if (!RESEND_API_KEY || !EMAIL_TO || !EMAIL_FROM) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing env vars",
          have: {
            RESEND_API_KEY: !!RESEND_API_KEY,
            EMAIL_TO: !!EMAIL_TO,
            EMAIL_FROM: !!EMAIL_FROM,
          },
        }),
      };
    }

    const mapsLink = `https://maps.google.com/?q=${body.lat},${body.lon}`;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        subject: "PieMap: location shared",
        text: `lat: ${body.lat}\nlon: ${body.lon}\naccuracy: ${body.accuracy_m}\ntime: ${body.timestamp}\nua: ${body.userAgent}\n\nMap: ${mapsLink}`,
      }),
    });

    const details = await resendResp.text();

    if (!resendResp.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Resend rejected request",
          status: resendResp.status,
          details,
        }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, details }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", message: String(e) }) };
  }
};
