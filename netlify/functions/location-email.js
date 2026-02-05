exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { lat, lon, accuracy_m, timestamp, userAgent } = JSON.parse(event.body || "{}");

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

    const mapsLink = `https://maps.google.com/?q=${lat},${lon}`;
    const text =
`PieMap location shared:
lat: ${lat}
lon: ${lon}
accuracy(m): ${accuracy_m ?? "n/a"}
time: ${timestamp ?? "n/a"}
ua: ${userAgent ?? "n/a"}

Map: ${mapsLink}
`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        subject: "PieMap: location shared",
        text,
      }),
    });

    if (!r.ok) {
      const detailsText = await r.text();
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Resend rejected the request",
          status: r.status,
          details: detailsText,
        }),
      };
    }

    return { statusCode: 204, body: "" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", message: String(e) }) };
  }
};
