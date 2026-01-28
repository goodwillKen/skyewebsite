export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { name, email, timestamp } = await request.json();

    // 1. Save to KV (The digital paper trail)
    // We use lowercase email as the key for easy lookup later
    await env.WAIVER_STORE.put(`waiver:${email.toLowerCase()}`, JSON.stringify({
      name,
      signedAt: timestamp,
      ip: request.headers.get("CF-Connecting-IP")
    }));

    // 2. Email a notification to you (Optional but recommended)
    await fetch("https://mail.grounded-intimacy.com/send-mail", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': env.VPS_API_KEY 
      },
      body: JSON.stringify({
        to: env.PRACTITIONER_EMAIL,
        subject: `[Waiver Signed] ${name}`,
        html: `<h3>New Waiver Signature</h3>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Time:</strong> ${timestamp}</p>`
      })
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}