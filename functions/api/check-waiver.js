export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  // 1. Basic validation
  if (!email) {
    return new Response(JSON.stringify({ error: "Email parameter is required." }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 2. Look up the email in your KV store (normalized to lowercase)
    // This matches the key format used in sign-waiver.js
    const waiverRecord = await env.WAIVER_STORE.get(`waiver:${email.toLowerCase()}`);

    // 3. Return the status
    if (waiverRecord) {
      // Record exists - user has signed
      return new Response(JSON.stringify({ 
        signed: true,
        data: JSON.parse(waiverRecord) 
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // No record found
      return new Response(JSON.stringify({ 
        signed: false 
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}