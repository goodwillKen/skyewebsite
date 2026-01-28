export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const { name, email, message, theme, consentSensitive, orderData, capacity } = data;

    if (consentSensitive !== true) {
      return new Response(JSON.stringify({ error: "Consent denied." }), { status: 403 });
    }

    const vpsApiUrl = "https://mail.grounded-intimacy.com/send-mail";
    const vpsApiKey = context.env.VPS_API_KEY; 
    const targetEmail = context.env.PRACTITIONER_EMAIL;

    // Construct the email body
    const adminHtml = `<h1>New Enquiry</h1><p>From: ${name} (${email})</p><p>${message}</p>`;

    // Call your VPS API
    const response = await fetch(vpsApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': vpsApiKey
      },
      body: JSON.stringify({
        to: targetEmail,
        subject: `[New Enquiry] ${name}`,
        html: adminHtml
      })
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const err = await response.text();
      throw new Error(err);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}