export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "anonymous";
  const countKey = `rate-limit-count:${ip}`;

  try {
    // 1. Check the current submission count for this IP
    const currentCount = parseInt(await env.LIMITER_STORE.get(countKey) || "0");
    
    if (currentCount >= 3) {
      return new Response(JSON.stringify({ 
        error: "Attempt limit reached. Please wait 5 minutes before trying again." 
      }), { status: 429 });
    }

    const data = await request.json();
    const { name, email, message, consentSensitive } = data;

    if (consentSensitive !== true) {
      return new Response(JSON.stringify({ error: "Consent denied." }), { status: 403 });
    }

    const vpsApiUrl = "https://mail.grounded-intimacy.com/send-mail";
    const vpsApiKey = env.VPS_API_KEY; 
    const targetEmail = env.PRACTITIONER_EMAIL;

    const adminHtml = `<h1>New Enquiry</h1><p>From: ${name} (${email})</p><p>${message}</p>`;

    // 2. Call your VPS API
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
      // 3. Increment the counter and set/refresh the 5-minute (300s) cooldown
      await env.LIMITER_STORE.put(countKey, (currentCount + 1).toString(), { expirationTtl: 300 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const err = await response.text();
      throw new Error(err);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}